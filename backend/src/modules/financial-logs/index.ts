import { Elysia, t } from "elysia";
import { eq, desc, and, sql, gte, lte, ilike, or, isNull, isNotNull } from "drizzle-orm";
import { db, financialLogs, logItems, attachments, users, organizations } from "../../db";
import { getAuthFromHeaders, isSuperAdmin, canAccessOrganization } from "../../middleware";
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  parsePaginationParams 
} from "../../utils";
import { getPresignedUrl, uploadToS3, generateS3Key, deleteFromS3 } from "../../lib/s3";

export const financialLogsModule = new Elysia({ prefix: "/logs" })
  /**
   * GET /api/logs
   * List financial logs with pagination, filtering, and search
   */
  .get(
    "/",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { page, limit, offset } = parsePaginationParams(query.page, query.limit);
      const { 
        search, 
        type, 
        startDate, 
        endDate, 
        organizationId,
        sortBy = "createdAt",
        sortOrder = "desc",
        status 
      } = query;

      // Build conditions
      const conditions = [];

      // Soft Delete Filter
      if (isSuperAdmin(auth) && status === "ARCHIVED") {
          conditions.push(isNotNull(financialLogs.deletedAt));
      } else {
          conditions.push(isNull(financialLogs.deletedAt));
      }

      // Filter by organization
      if (isSuperAdmin(auth)) {
        // Super admin can filter by specific org or see all
        if (organizationId) {
          conditions.push(eq(financialLogs.organizationId, organizationId));
        }
      } else {
        // Non-super admin can only see their own org
        conditions.push(eq(financialLogs.organizationId, auth.user.organizationId));
      }

      // Filter by type
      if (type) {
        conditions.push(eq(financialLogs.type, type));
      }

      // Filter by date range
      if (startDate) {
        conditions.push(gte(financialLogs.createdAt, new Date(startDate)));
      }

      if (endDate) {
        // Add 1 day to include the end date fully
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        conditions.push(lte(financialLogs.createdAt, endDateTime));
      }

      // Search in description
      if (search) {
        conditions.push(ilike(financialLogs.description, `%${search}%`));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // Determine sort order
      const orderByColumn = sortBy === "totalAmount" ? financialLogs.totalAmount : financialLogs.createdAt;
      const orderBy = sortOrder === "asc" ? orderByColumn : desc(orderByColumn);

      const [logs, countResult] = await Promise.all([
        db.query.financialLogs.findMany({
          with: {
            user: true,
            organization: true,
            attachments: {
              limit: 1, // Fetch at least one to show preview
            },
          },
          where: whereCondition,
          orderBy: orderBy,
          limit: limit,
          offset: offset,
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(financialLogs)
          .where(whereCondition),
      ]);

      // Format response
      const formattedLogs = await Promise.all(logs.map(async (log) => {
        let attachmentUrl = null;
        if (log.attachments && log.attachments.length > 0) {
           attachmentUrl = await getPresignedUrl(log.attachments[0].s3Key);
        }

        return {
            id: log.id,
            type: log.type,
            description: log.description,
            totalAmount: parseFloat(log.totalAmount),
            transactionDate: log.transactionDate,
            createdAt: log.createdAt,
            user: {
                id: log.user.id,
                name: log.user.name,
            },
            organization: {
                id: log.organization.id,
                name: log.organization.name,
                slug: log.organization.slug,
            },
            attachmentUrl,
        };
      }));

      return paginatedResponse(formattedLogs, Number(countResult[0].count), page, limit);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        type: t.Optional(t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")])),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        organizationId: t.Optional(t.String({ format: "uuid" })),
        sortBy: t.Optional(t.Union([t.Literal("createdAt"), t.Literal("totalAmount")])),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        status: t.Optional(t.Literal("ARCHIVED")), // Add status validation
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "List Financial Logs",
        description: "Menampilkan daftar log keuangan dengan filtering dan pagination.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of financial logs",
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
   * GET /api/logs/:id
   * Get single log detail with items and attachments
   */
  .get(
    "/:id",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      const [log] = await db
        .select({
          id: financialLogs.id,
          type: financialLogs.type,
          description: financialLogs.description,
          totalAmount: financialLogs.totalAmount,
          createdAt: financialLogs.createdAt,
          organizationId: financialLogs.organizationId,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          organization: {
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            address: organizations.address,
            phone: organizations.phone,
            email: organizations.email,
            website: organizations.website,
            logo: organizations.logo,
          },
        })
        .from(financialLogs)
        .innerJoin(users, eq(financialLogs.userId, users.id))
        .innerJoin(organizations, eq(financialLogs.organizationId, organizations.id))
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) {
        return notFoundResponse("Financial log");
      }

      // Check access permission
      if (!canAccessOrganization(auth, log.organizationId)) {
        return forbiddenResponse();
      }

      // Get items
      const items = await db
        .select()
        .from(logItems)
        .where(eq(logItems.logId, id));

      // Get attachments with presigned URLs
      const attachmentRecords = await db
        .select()
        .from(attachments)
        .where(eq(attachments.logId, id));

      const attachmentsWithUrls = await Promise.all(
        attachmentRecords.map(async (attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt,
          url: await getPresignedUrl(attachment.s3Key),
        }))
      );

      // Format items
      const formattedItems = items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        subTotal: parseFloat(item.subTotal),
      }));

      // Generate presigned URL for organization logo
      if (log.organization.logo) {
          log.organization.logo = await getPresignedUrl(log.organization.logo);
      }

      return successResponse({
        id: log.id,
        type: log.type,
        description: log.description,
        totalAmount: parseFloat(log.totalAmount),
        createdAt: log.createdAt,
        user: log.user,
        organization: log.organization,
        items: formattedItems,
        attachments: attachmentsWithUrls,
      });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Get Log Detail",
        description: "Mendapatkan detail log keuangan beserta item dan attachment.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Financial log detail",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/FinancialLogDetail" } },
                    },
                  ],
                },
              },
            },
          },
          404: {
            description: "Log not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * POST /api/logs
   * Create new financial log
   */
  .post(
    "/",
    async ({ body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { type, description, totalAmount, items, transactionDate, organizationId } = body;

      // Determine Organization ID
      let targetOrgId = auth.user.organizationId;
      if (isSuperAdmin(auth) && organizationId) {
          targetOrgId = organizationId;
      }

      // Insert log
      const [newLog] = await db
        .insert(financialLogs)
        .values({
          organizationId: targetOrgId,
          userId: auth.user.id,
          type,
          description,
          totalAmount: totalAmount.toString(),
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        })
        .returning();

      // Insert items if provided
      let createdItems: typeof logItems.$inferSelect[] = [];
      if (items && items.length > 0) {
        createdItems = await db
          .insert(logItems)
          .values(
            items.map((item) => ({
              logId: newLog.id,
              itemName: item.itemName,
              quantity: (item.quantity || 1).toString(),
              unitPrice: item.unitPrice.toString(),
              subTotal: ((item.quantity || 1) * item.unitPrice).toString(),
            }))
          )
          .returning();
      }

      return successResponse({
        id: newLog.id,
        type: newLog.type,
        description: newLog.description,
        totalAmount: parseFloat(newLog.totalAmount),
        transactionDate: newLog.transactionDate,
        createdAt: newLog.createdAt,
        organizationId: newLog.organizationId,
        userId: newLog.userId,
        items: createdItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          subTotal: parseFloat(item.subTotal),
        })),
      }, "Financial log created successfully");
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")]),
        description: t.String({ minLength: 3, maxLength: 1000 }),
        totalAmount: t.Number({ minimum: 0 }),
        transactionDate: t.Optional(t.String()), // ISO String
        organizationId: t.Optional(t.String({ format: "uuid" })),
        items: t.Optional(
          t.Array(
            t.Object({
              itemName: t.String({ minLength: 1, maxLength: 255 }),
              quantity: t.Optional(t.Number({ minimum: 0 })),
              unitPrice: t.Number({ minimum: 0 }),
            })
          )
        ),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Create Financial Log",
        description: "Membuat log keuangan baru dengan item opsional.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Log created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/FinancialLogDetail" } },
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
   * PUT /api/logs/:id
   * Update financial log (within 24 hours for staff)
   */
  .put(
    "/:id",
    async ({ params, body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      const [log] = await db
        .select()
        .from(financialLogs)
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) {
        return notFoundResponse("Financial log");
      }

      // Check access
      if (!canAccessOrganization(auth, log.organizationId)) {
        return forbiddenResponse();
      }

      // Staff can only edit their own logs within 24 hours
      if (auth.user.role === "STAFF") {
        if (log.userId !== auth.user.id) {
          return forbiddenResponse("You can only edit your own logs");
        }

        const hoursSinceCreation = 
          (Date.now() - log.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
          return errorResponse("Cannot edit logs older than 24 hours");
        }
      }

      const { type, description, totalAmount } = body;

      const [updated] = await db
        .update(financialLogs)
        .set({
          type: type || log.type,
          description: description || log.description,
          totalAmount: totalAmount?.toString() || log.totalAmount,
        })
        .where(eq(financialLogs.id, id))
        .returning();

      return successResponse({
        id: updated.id,
        type: updated.type,
        description: updated.description,
        totalAmount: parseFloat(updated.totalAmount),
        createdAt: updated.createdAt,
      }, "Financial log updated successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        type: t.Optional(t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")])),
        description: t.Optional(t.String({ minLength: 3, maxLength: 1000 })),
        totalAmount: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Update Financial Log",
        description: "Update log keuangan. Staff hanya bisa update log sendiri dalam 24 jam.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Log updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          403: {
            description: "Forbidden (time limit or ownership)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * DELETE /api/logs/:id
   * Delete financial log (with time limit for staff)
   */
  .delete(
    "/:id",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      const [log] = await db
        .select()
        .from(financialLogs)
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) {
        return notFoundResponse("Financial log");
      }

      // Check access
      if (!canAccessOrganization(auth, log.organizationId)) {
        return forbiddenResponse();
      }

      // Staff can only delete within 24 hours
      if (auth.user.role === "STAFF") {
        const hoursSinceCreation =
          (Date.now() - log.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
          return errorResponse("Cannot delete logs older than 24 hours");
        }
      }

      // Soft Delete: Update deletedAt timestamp instead of removing record
      // Note: Attachments remains in S3 as archive

      await db
        .update(financialLogs)
        .set({ deletedAt: new Date() })
        .where(eq(financialLogs.id, id));

      return successResponse(null, "Financial log archived successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Delete Financial Log",
        description: "Menghapus log keuangan. Staff hanya bisa hapus log sendiri dalam 24 jam.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Log deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          403: {
            description: "Forbidden",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * POST /api/logs/:id/restore
   * Restore archived financial log
   */
  .post(
    "/:id/restore",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) return unauthorizedResponse();

      // Only Super Admin can restore logs for now
      if (!isSuperAdmin(auth)) {
          return forbiddenResponse("Only Super Admin can restore logs");
      }

      const { id } = params;

      const [log] = await db
        .select()
        .from(financialLogs)
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) return notFoundResponse("Financial log");

      await db
        .update(financialLogs)
        .set({ deletedAt: null })
        .where(eq(financialLogs.id, id));

      return successResponse(null, "Financial log restored successfully");
    },
    {
        params: t.Object({
            id: t.String({ format: "uuid" }),
        }),
        detail: {
            tags: ["Financial Logs"],
            summary: "Restore Log",
            description: "Mengembalikan log yang sudah di-archive.",
            security: [{ bearerAuth: [] }],
        }
    }
  )

  /**
   * POST /api/logs/:id/attachments
   * Upload attachment to a financial log
   */
  .post(
    "/:id/attachments",
    async ({ params, body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      const [log] = await db
        .select()
        .from(financialLogs)
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) {
        return notFoundResponse("Financial log");
      }

      if (!canAccessOrganization(auth, log.organizationId)) {
        return forbiddenResponse();
      }

      const file = body.file;
      const buffer = await file.arrayBuffer();
      const s3Key = generateS3Key(auth.user.organization.slug, file.name);

      await uploadToS3(s3Key, Buffer.from(buffer), file.type);

      const [newAttachment] = await db
        .insert(attachments)
        .values({
          logId: id,
          s3Key,
          fileName: file.name,
          mimeType: file.type,
        })
        .returning();

      return successResponse({
        id: newAttachment.id,
        fileName: newAttachment.fileName,
        mimeType: newAttachment.mimeType,
        uploadedAt: newAttachment.uploadedAt,
        url: await getPresignedUrl(s3Key),
      }, "Attachment uploaded successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        file: t.File({
          maxSize: "10m",
          type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        }),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Upload Attachment",
        description: "Upload file attachment (gambar/PDF, max 10MB).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "File uploaded",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/Attachment" } },
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
   * DELETE /api/logs/:id/attachments/:attachmentId
   * Delete attachment from a financial log
   */
  .delete(
    "/:id/attachments/:attachmentId",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id, attachmentId } = params;

      const [log] = await db
        .select()
        .from(financialLogs)
        .where(eq(financialLogs.id, id))
        .limit(1);

      if (!log) {
        return notFoundResponse("Financial log");
      }

      if (!canAccessOrganization(auth, log.organizationId)) {
        return forbiddenResponse();
      }

      const [attachment] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, attachmentId))
        .limit(1);

      if (!attachment) {
        return notFoundResponse("Attachment");
      }

      if (attachment.logId !== id) {
        return errorResponse("Attachment does not belong to this log");
      }

      await deleteFromS3(attachment.s3Key);
      await db.delete(attachments).where(eq(attachments.id, attachmentId));

      return successResponse(null, "Attachment deleted successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
        attachmentId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Financial Logs"],
        summary: "Delete Attachment",
        description: "Menghapus attachment dari log.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Attachment deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
        },
      },
    }
  );
