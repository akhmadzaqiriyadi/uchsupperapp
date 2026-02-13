import { Elysia, t } from "elysia";
import { eq, desc, sql, gte, lte, and, or, isNull } from "drizzle-orm";
import { db, financialLogs, organizations, users, logItems } from "../../db";
import { getAuthFromHeaders, isSuperAdmin } from "../../middleware";
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse,
  paginatedResponse,
  parsePaginationParams 
} from "../../utils";

export const dashboardModule = new Elysia({ prefix: "/dashboard" })
  /**
  /**
   * GET /api/dashboard/feed
   * Recent activity feed (Multi-tenant)
   */
  .get(
    "/feed",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) return unauthorizedResponse();

      // Permission filtering
      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const { page, limit, offset } = parsePaginationParams(query.page, query.limit);
      
      const conditions = [];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }
      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, countResult] = await Promise.all([
        db
          .select({
            id: financialLogs.id,
            type: financialLogs.type,
            description: financialLogs.description,
            totalAmount: financialLogs.totalAmount,
            createdAt: financialLogs.createdAt,
            user: {
              id: users.id,
              name: users.name,
            },
            organization: {
              id: organizations.id,
              name: organizations.name,
              slug: organizations.slug,
            },
          })
          .from(financialLogs)
          .innerJoin(users, eq(financialLogs.userId, users.id))
          .innerJoin(organizations, eq(financialLogs.organizationId, organizations.id))
          .where(whereCondition)
          .orderBy(desc(financialLogs.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(financialLogs)
          .where(whereCondition),
      ]);

      const formattedLogs = logs.map(log => ({
        ...log,
        totalAmount: parseFloat(log.totalAmount),
      }));

      return paginatedResponse(formattedLogs, Number(countResult[0].count), page, limit);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        organizationId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Activity Feed",
        description: "Feed aktivitas log terbaru. Admin Lini hanya melihat organisasinya.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Activity feed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/FinancialLog" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
    }
  )


  /**
   * GET /api/dashboard/chart
   * Financial trend analytics with dynamic period
   */
  .get(
    "/chart",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) return unauthorizedResponse();

      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const period = query.period || "month";
      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      const startDate = new Date();

      // Determine date range based on period
      if (period === "week") {
        startDate.setDate(startDate.getDate() - 6); // Last 7 days (today + 6 days back)
        startDate.setHours(0, 0, 0, 0); // Start of day
      } else if (period === "month") {
        startDate.setDate(1); // Start from 1st of current month
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "year") {
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1); // Start from 1st day of 11 months ago
        startDate.setHours(0, 0, 0, 0);
      }

      // Fetch logs in date range
      const safeCondition = or(
          gte(financialLogs.transactionDate, startDate),
          and(
              isNull(financialLogs.transactionDate),
              gte(financialLogs.createdAt, startDate)
          )
      );
      
      const conditions = [safeCondition];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }

      const logs = await db.query.financialLogs.findMany({
          where: and(...conditions),
          columns: {
             type: true,
             totalAmount: true,
             transactionDate: true,
             createdAt: true,
          }
      });

      // Initialize data structure based on period
      const statsMap = new Map<string, { income: number; expense: number }>();
      
      if (period === "year") {
        // Monthly aggregation for year
        const current = new Date(startDate);
        const endMonthStr = endDate.toISOString().slice(0, 7);
        
        while (true) {
            const mStr = current.toISOString().slice(0, 7);
            statsMap.set(mStr, { income: 0, expense: 0 });
            
            if (mStr === endMonthStr) break;
            current.setMonth(current.getMonth() + 1);
            if (statsMap.size > 24) break; // safety
        }
      } else {
        // Daily aggregation for week/month
        let daysDiff: number;
        
        if (period === "week") {
          // Exactly 7 days
          daysDiff = 7;
        } else {
          // Month: from 1st to today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          daysDiff = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        
        // Generate days
        for (let i = 0; i < daysDiff; i++) {
          const current = new Date(startDate);
          current.setDate(current.getDate() + i);
          const dayStr = current.toISOString().slice(0, 10);
          statsMap.set(dayStr, { income: 0, expense: 0 });
        }
      }

      // Process logs
      logs.forEach(log => {
          const date = log.transactionDate ? new Date(log.transactionDate) : new Date(log.createdAt);
          let periodKey: string;
          
          if (period === "year") {
              periodKey = date.toISOString().slice(0, 7); // YYYY-MM
          } else {
              periodKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
          }
          
          if (statsMap.has(periodKey)) {
              const entry = statsMap.get(periodKey)!;
              const amount = parseFloat(log.totalAmount);
              
              if (log.type === "INCOME") {
                  entry.income += amount;
              } else {
                  entry.expense += amount;
              }
          }
      });

      // Convert to array with formatted labels
      const chartData = Array.from(statsMap.entries()).map(([key, data]) => {
          let displayLabel = key;
          
          if (period === "week" || period === "month") {
              // Format: "DD" (day of month)
              const date = new Date(key);
              displayLabel = String(date.getDate()).padStart(2, '0');
          } else {
              // Format: "YYYY-MM" for year
              displayLabel = key;
          }
          
          return {
              period: displayLabel,
              income: data.income,
              expense: data.expense,
              net: data.income - data.expense
          };
      });

      chartData.sort((a, b) => a.period.localeCompare(b.period));

      return successResponse(chartData);
    },
    {
      query: t.Object({
        organizationId: t.Optional(t.String({ format: "uuid" })),
        period: t.Optional(t.Union([
          t.Literal("week"),
          t.Literal("month"),
          t.Literal("year"),
        ])),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Analytics Chart Data",
        description: "Data grafik income/expense dengan period dinamis (week/month/year).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Chart data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/dashboard/rankings
   * Top Items by Revenue or Expense
   */
  .get(
    "/rankings",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) return unauthorizedResponse();

      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const type = query.type as "INCOME" | "EXPENSE" || "EXPENSE";
      const limit = query.limit || 5;

      const conditions = [eq(financialLogs.type, type)];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }

      // Find top expensive/generating items
      const rankings = await db
        .select({
          itemName: logItems.itemName,
          totalAmount: sql<string>`SUM(${logItems.subTotal})`,
          count: sql<number>`SUM(${logItems.quantity})`,
          avgPrice: sql<number>`AVG(${logItems.unitPrice})`
        })
        .from(logItems)
        .innerJoin(financialLogs, eq(logItems.logId, financialLogs.id))
        .where(and(...conditions))
        .groupBy(logItems.itemName)
        .orderBy(desc(sql`SUM(${logItems.subTotal})`))
        .limit(limit);

      return successResponse(
        rankings.map(r => ({
          name: r.itemName,
          value: parseFloat(r.totalAmount || "0"),
          count: Number(r.count),
          avgPrice: parseFloat(String(r.avgPrice))
        }))
      );
    },
    {
      query: t.Object({
        organizationId: t.Optional(t.String({ format: "uuid" })),
        type: t.Optional(t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")])),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 20 })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Item Rankings",
        description: "Top item ranking berdasarkan nilai transaksi (Terlaris/Terboros).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Ranking data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/dashboard/summary
   * Financial summary by period (Multi-tenant compliant)
   */
  .get(
    "/summary",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) return unauthorizedResponse();

      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const period = query.period || "month";
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const conditions = [
        gte(financialLogs.transactionDate, startDate),
        lte(financialLogs.transactionDate, now)
      ];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }

      // Calculate Previous Period Dates for Comparison
      let prevStartDate: Date;
      let prevEndDate: Date;
      const duration = now.getTime() - startDate.getTime();
      
      prevEndDate = new Date(startDate.getTime() - 1); // 1ms before current start
      prevStartDate = new Date(prevEndDate.getTime() - duration);

      const prevConditions = [
        gte(financialLogs.transactionDate, prevStartDate),
        lte(financialLogs.transactionDate, prevEndDate)
      ];
      if (filterOrgId) {
        prevConditions.push(eq(financialLogs.organizationId, filterOrgId));
      }

      const whereCondition = and(...conditions);
      const prevWhereCondition = and(...prevConditions);

      // Get Overall Totals (Current Period)
      const [overall] = await db
        .select({
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'INCOME' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'EXPENSE' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          totalLogs: sql<number>`COUNT(*)`,
        })
        .from(financialLogs)
        .where(whereCondition);

      // Get Overall Totals (Previous Period)
      const [prevOverall] = await db
        .select({
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'INCOME' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'EXPENSE' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
        })
        .from(financialLogs)
        .where(prevWhereCondition);

      const totalIncome = parseFloat(overall?.totalIncome || "0");
      const totalExpense = parseFloat(overall?.totalExpense || "0");
      const netBalance = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      
      // Calculate Previous Stats
      const prevTotalIncome = parseFloat(prevOverall?.totalIncome || "0");
      const prevTotalExpense = parseFloat(prevOverall?.totalExpense || "0");
      const prevNetBalance = prevTotalIncome - prevTotalExpense;

      // Helper for growth calculation
      const calculateGrowth = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / Math.abs(previous)) * 100;
      };

      const growth = {
          income: calculateGrowth(totalIncome, prevTotalIncome),
          expense: calculateGrowth(totalExpense, prevTotalExpense),
          netBalance: calculateGrowth(netBalance, prevNetBalance),
      };

      // Per Organization Breakdown
      const orgSummary = await db
        .select({
          organizationId: financialLogs.organizationId,
          organizationName: organizations.name,
          organizationSlug: organizations.slug,
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'INCOME' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'EXPENSE' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          logCount: sql<number>`COUNT(*)`,
        })
        .from(financialLogs)
        .innerJoin(organizations, eq(financialLogs.organizationId, organizations.id))
        .where(whereCondition)
        .groupBy(financialLogs.organizationId, organizations.name, organizations.slug);

      return successResponse({
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        scope: filterOrgId ? "Organization" : "Global",
        overall: {
          totalIncome,
          totalExpense,
          netBalance,
          profitMargin,
          totalLogs: Number(overall?.totalLogs || 0),
          growth, // New field
        },
        breakdown: orgSummary.map((org) => {

          const inc = parseFloat(org.totalIncome || "0");
          const exp = parseFloat(org.totalExpense || "0");
          return {
            id: org.organizationId,
            name: org.organizationName,
            slug: org.organizationSlug,
            totalIncome: inc,
            totalExpense: exp,
            netBalance: inc - exp,
            logCount: Number(org.logCount),
          };
        }),
      });
    },
    {
      query: t.Object({
        period: t.Optional(t.Union([t.Literal("week"), t.Literal("month"), t.Literal("year")])),
        organizationId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Financial Summary",
        description: "Ringkasan keuangan, balance, dan margin.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Summary data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/dashboard/comparison
   * Get activity comparison between organizations
   * Super Admin only
   */
  .get(
    "/comparison",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isSuperAdmin(auth)) {
        return forbiddenResponse("SUPER_ADMIN");
      }

      const days = query.days || 30;
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const comparison = await db
        .select({
          organizationId: organizations.id,
          organizationName: organizations.name,
          organizationSlug: organizations.slug,
          isCenter: organizations.isCenter,
          logCount: sql<number>`COALESCE(COUNT(${financialLogs.id}), 0)`,
          lastActivity: sql<Date>`MAX(${financialLogs.createdAt})`,
        })
        .from(organizations)
        .leftJoin(
          financialLogs,
          sql`${financialLogs.organizationId} = ${organizations.id} AND ${financialLogs.createdAt} >= ${daysAgo}`
        )
        .groupBy(
          organizations.id,
          organizations.name,
          organizations.slug,
          organizations.isCenter
        )
        .orderBy(desc(sql`COUNT(${financialLogs.id})`));

      const formattedComparison = comparison.map((org) => {
        const lastActivityDate = org.lastActivity ? new Date(org.lastActivity) : null;
        const daysSinceLastActivity = lastActivityDate
          ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          organizationId: org.organizationId,
          organizationName: org.organizationName,
          organizationSlug: org.organizationSlug,
          isCenter: org.isCenter,
          logCount: Number(org.logCount),
          lastActivity: lastActivityDate?.toISOString() || null,
          status: Number(org.logCount) > 0 ? "ACTIVE" : "INACTIVE",
          daysSinceLastActivity,
        };
      });

      return successResponse({
        period: `Last ${days} days`,
        organizations: formattedComparison,
        summary: {
          totalOrganizations: formattedComparison.length,
          activeOrganizations: formattedComparison.filter(o => o.status === "ACTIVE").length,
          inactiveOrganizations: formattedComparison.filter(o => o.status === "INACTIVE").length,
        },
      });
    },
    {
      query: t.Object({
        days: t.Optional(t.Numeric({ minimum: 1, maximum: 365 })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Organization Comparison",
        description: "Perbandingan aktivitas antar organisasi (Hanya Super Admin).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Comparison data",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/OrganizationComparison" } },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    }
  )

  /**
   * GET /api/dashboard/stats
   * Get quick stats overview (Multi-tenant compliant)
   */
  .get(
    "/stats",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      // Determine organization filter
      let filterOrgId: string | undefined = undefined;
      
      if (isSuperAdmin(auth)) {
        // Super admin can filter by specific org via query param
        if (query.organizationId) {
          filterOrgId = query.organizationId;
        }
      } else {
        // Regular admin/staff strictly limited to their own org
        filterOrgId = auth.user.organizationId;
      }

      // Build where condition
      const logConditions = [];
      if (filterOrgId) {
        logConditions.push(eq(financialLogs.organizationId, filterOrgId));
      }

      const whereLog = logConditions.length > 0 ? and(...logConditions) : undefined;
      const whereUser = filterOrgId ? eq(users.organizationId, filterOrgId) : undefined;

      // Parallel queries
      const [orgResult, userResult, logResult, todayResult] = await Promise.all([
        // 1. Total Organizations (Only makes sense for Global View)
        !filterOrgId ? db.select({ count: sql<number>`count(*)` }).from(organizations) : Promise.resolve([{ count: 1 }]),
        
        // 2. Total Users
        db.select({ count: sql<number>`count(*)` }).from(users).where(whereUser),
        
        // 3. Total Logs
        db.select({ count: sql<number>`count(*)` }).from(financialLogs).where(whereLog),

        // 4. Today's Activity
        db
          .select({
            count: sql<number>`count(*)`,
            income: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'INCOME' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
            expense: sql<string>`COALESCE(SUM(CASE WHEN ${financialLogs.type} = 'EXPENSE' THEN ${financialLogs.totalAmount} ELSE 0 END), 0)`,
          })
          .from(financialLogs)
          .where(
            and(
              gte(financialLogs.createdAt, sql`CURRENT_DATE`),
              whereLog ? whereLog : sql`TRUE`
            )
          )
      ]);
      
      return successResponse({
        scope: filterOrgId ? "Organization" : "Global",
        totalOrganizations: Number(orgResult[0].count),
        totalUsers: Number(userResult[0].count),
        totalLogs: Number(logResult[0].count),
        today: {
          date: new Date().toISOString().split("T")[0],
          logsCreated: Number(todayResult[0]?.count || 0),
          totalIncome: parseFloat(todayResult[0]?.income || "0"),
          totalExpense: parseFloat(todayResult[0]?.expense || "0"),
          netChange: parseFloat(todayResult[0]?.income || "0") - parseFloat(todayResult[0]?.expense || "0"),
        },
      });
    },
    {
      query: t.Object({
        organizationId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Quick Stats",
        description: "Statistik cepat. Jika Admin Lini, otomatis terfilter ke organisasinya.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Quick stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/dashboard/export
   * Export financial report to CSV
   */
  .get(
    "/export",
    async ({ query, headers, set }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      // For file download via browser directly (if token in query) or fetch blob
      // If we use fetch(blob) in frontend, we pass Authorization header.
      if (!auth) return unauthorizedResponse();

      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const conditions = [];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }
      
      if (query.startDate) {
          conditions.push(gte(financialLogs.transactionDate, new Date(query.startDate)));
      }
      if (query.endDate) {
          conditions.push(lte(financialLogs.transactionDate, new Date(query.endDate)));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
          .select({
            date: financialLogs.transactionDate,
            createdAt: financialLogs.createdAt,
            type: financialLogs.type,
            amount: financialLogs.totalAmount,
            description: financialLogs.description,
            user: users.name,
            organization: organizations.slug,
          })
          .from(financialLogs)
          .innerJoin(users, eq(financialLogs.userId, users.id))
          .innerJoin(organizations, eq(financialLogs.organizationId, organizations.id))
          .where(whereCondition)
          .orderBy(desc(financialLogs.transactionDate));

      // Generate CSV
      const header = "Date,Type,Amount,Description,Staff,Organization";
      const rows = logs.map(log => {
          const date = log.date ? new Date(log.date).toISOString().split('T')[0] : new Date(log.createdAt).toISOString().split('T')[0];
          const type = log.type;
          const amount = log.amount;
          // Escape quotes and commas
          const desc = `"${(log.description || "").replace(/"/g, '""')}"`;
          const staff = `"${(log.user || "").replace(/"/g, '""')}"`;
          const org = log.organization;
          
          return `${date},${type},${amount},${desc},${staff},${org}`;
      });

      const csvContent = [header, ...rows].join("\n");

      set.headers["Content-Type"] = "text/csv; charset=utf-8";
      set.headers["Content-Disposition"] = `attachment; filename="report-${new Date().toISOString().slice(0,10)}.csv"`;
      
      return csvContent;
    },
    {
      query: t.Object({
        organizationId: t.Optional(t.String({ format: "uuid" })),
        startDate: t.Optional(t.String()), // ISO Date
        endDate: t.Optional(t.String()), // ISO Date
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Export Report",
        description: "Export data keuangan ke CSV. RBAC Compliant.",
      }
    }
  )
  
  /**
   * GET /api/dashboard/insights
   * Advanced Business Intelligence (Patterns & Distribution)
   */
  .get(
    "/insights",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      // Helper function defined inline to avoid scope issues
      const generateRecommendation = (avgTicket: number, dayCounts: number[], hourCounts: number[]) => {
            const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            
            return [
                `Optimal staffing needed on ${days[busiestDayIndex]}s due to high volume.`,
                `Average transaction value is ${avgTicket.toLocaleString()} - consider bundling items to increase this.`,
            ];
      };

      if (!auth) return unauthorizedResponse();

      let filterOrgId: string | undefined = undefined;
      if (!isSuperAdmin(auth)) {
        filterOrgId = auth.user.organizationId;
      } else if (query.organizationId) {
        filterOrgId = query.organizationId;
      }

      const conditions = [];
      if (filterOrgId) {
        conditions.push(eq(financialLogs.organizationId, filterOrgId));
      }
      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // 1. Heatmap Analysis
      const timeAnalysis = await db
        .select({
          dayOfWeek: sql<number>`extract(dow from ${financialLogs.createdAt})`,
          hourOfDay: sql<number>`extract(hour from ${financialLogs.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(financialLogs)
        .where(whereCondition)
        .groupBy(sql`extract(dow from ${financialLogs.createdAt})`, sql`extract(hour from ${financialLogs.createdAt})`);

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = new Array(7).fill(0);
      const hourCounts = new Array(24).fill(0);
      
      timeAnalysis.forEach(row => {
          dayCounts[Number(row.dayOfWeek)] += Number(row.count);
          hourCounts[Number(row.hourOfDay)] += Number(row.count);
      });

      const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
      const busiestHourIndex = hourCounts.indexOf(Math.max(...hourCounts));

      // 2. Ticket Size Distribution
      const logs = await db
        .select({ amount: financialLogs.totalAmount })
        .from(financialLogs)
        .where(
            and(
                whereCondition,
                eq(financialLogs.type, "INCOME")
            )
        );
      
      const values = logs.map(l => parseFloat(l.amount)).sort((a,b) => a - b);
      const totalRev = values.reduce((a, b) => a + b, 0);
      const avgTicket = values.length ? totalRev / values.length : 0;
      const minTicket = values.length ? values[0] : 0;
      const maxTicket = values.length ? values[values.length - 1] : 0;
      const medianTicket = values.length ? values[Math.floor(values.length / 2)] : 0;

      return successResponse({
        timePatterns: {
            busiestDay: days[busiestDayIndex],
            busiestHour: `${busiestHourIndex}:00 - ${busiestHourIndex+1}:00`,
            transactionHeatmap: { days: dayCounts, hours: hourCounts }
        },
        ticketSize: {
            average: avgTicket,
            median: medianTicket,
            min: minTicket,
            max: maxTicket,
            distribution: {
                small: values.filter(v => v < avgTicket * 0.5).length,
                medium: values.filter(v => v >= avgTicket * 0.5 && v < avgTicket * 1.5).length,
                large: values.filter(v => v >= avgTicket * 1.5).length,
            }
        },
        recommendation: generateRecommendation(avgTicket, dayCounts, hourCounts)
      });
    },
    {
      query: t.Object({
        organizationId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Dashboard"],
        summary: "Business Insights",
        description: "Analisis cerdas pola bisnis dan distribusi transaksi.",
        security: [{ bearerAuth: [] }],
      }
    }
  );
