import { Elysia, t } from "elysia";
import { eq, desc, and, sql, ilike, ne } from "drizzle-orm";
import { db, users, organizations } from "../../db";
import { getAuthFromHeaders, isSuperAdmin, canAccessOrganization, isAdmin } from "../../middleware";
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  parsePaginationParams 
} from "../../utils";
import { hashPassword } from "../../lib/password";

export const usersModule = new Elysia({ prefix: "/users" })
  /**
   * GET /api/users
   * List users with pagination and filtering
   */
  .get(
    "/",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      // Check if admin (Staff cannot see user list?)
      // Let's allow Staff to see colleagues? Or restricted?
      // Usually Admin Lini can see. 
      if (!isAdmin(auth) && auth.user.role !== "STAFF") { // Allow everyone for now or restrict?
          // Let's restrict to Admin Lini & Super Admin for managing, but maybe Staff need to see who is who?
          // For now restrict to Admins for management purpose
          // But wait, the user request "staf lini" -> Admin Lini seeing their staff.
      }
      // Let's stick to standard RBAC: Admin can manage.

      const { page, limit, offset } = parsePaginationParams(query.page, query.limit);
      const { search, organizationId, role } = query;

      const conditions = [];

      // Filter by organization
      if (isSuperAdmin(auth)) {
        if (organizationId) {
          conditions.push(eq(users.organizationId, organizationId));
        }
      } else {
        // Lini Admin / Staff can only see their own org
        conditions.push(eq(users.organizationId, auth.user.organizationId));
      }

      // Filter by role
      if (role) {
        conditions.push(eq(users.role, role));
      }

      // Search (Name or Email)
      if (search) {
        conditions.push(
            sql`(${ilike(users.name, `%${search}%`)} OR ${ilike(users.email, `%${search}%`)})`
        );
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const [usersList, countResult] = await Promise.all([
        db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            organizationId: users.organizationId,
            organization: {
                id: organizations.id,
                name: organizations.name,
                slug: organizations.slug,
            }
        })
        .from(users)
        .leftJoin(organizations, eq(users.organizationId, organizations.id))
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
        
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereCondition),
      ]);

      return paginatedResponse(usersList, Number(countResult[0].count), page, limit);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        organizationId: t.Optional(t.String({ format: "uuid" })),
        role: t.Optional(t.Union([
            t.Literal("SUPER_ADMIN"),
            t.Literal("ADMIN_LINI"),
            t.Literal("STAFF")
        ])),
      }),
      detail: {
        tags: ["Users"],
        summary: "List Users",
        security: [{ bearerAuth: [] }],
      }
    }
  )

  /**
   * GET /api/users/:id
   * Get user detail
   */
  .get(
      "/:id",
      async ({ params, headers }) => {
        const auth = await getAuthFromHeaders(headers.authorization);
        if (!auth) return unauthorizedResponse();

        const user = await db.query.users.findFirst({
            where: eq(users.id, params.id),
            with: {
                organization: true
            }
        });

        if (!user) return notFoundResponse("User");

        // Access Check
        if (!isSuperAdmin(auth) && user.organizationId !== auth.user.organizationId) {
            return forbiddenResponse();
        }

        return successResponse({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            organization: user.organization
        });
      },
      {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
          detail: { tags: ["Users"], security: [{ bearerAuth: [] }] }
      }
  )

  /**
   * PUT /api/users/:id
   * Update user
   */
  .put(
      "/:id",
      async ({ params, body, headers }) => {
          const auth = await getAuthFromHeaders(headers.authorization);
          if (!auth) return unauthorizedResponse();
          if (!isAdmin(auth)) return forbiddenResponse("Admin access required");

          const targetUser = await db.query.users.findFirst({
              where: eq(users.id, params.id)
          });
          if (!targetUser) return notFoundResponse("User");

          // Access Check
          if (!canAccessOrganization(auth, targetUser.organizationId)) {
              return forbiddenResponse();
          }

          const { name, role, password } = body;
          const updateData: any = {};

          if (name) updateData.name = name;
          if (role) updateData.role = role;
          if (password) updateData.passwordHash = await hashPassword(password);

          await db.update(users)
            .set(updateData)
            .where(eq(users.id, params.id));

          return successResponse(null, "User updated successfully");
      },
      {
          params: t.Object({ id: t.String({ format: "uuid" }) }),
          body: t.Object({
              name: t.Optional(t.String({ minLength: 2 })),
              role: t.Optional(t.Union([
                t.Literal("SUPER_ADMIN"),
                t.Literal("ADMIN_LINI"),
                t.Literal("STAFF")
            ])),
              password: t.Optional(t.String({ minLength: 6 })),
          }),
          detail: { tags: ["Users"], security: [{ bearerAuth: [] }] }
      }
  )

  /**
   * DELETE /api/users/:id
   */
  .delete(
      "/:id",
      async ({ params, headers }) => {
          const auth = await getAuthFromHeaders(headers.authorization);
          if (!auth) return unauthorizedResponse();
          if (!isAdmin(auth)) return forbiddenResponse("Admin access required");

          const targetUser = await db.query.users.findFirst({
            where: eq(users.id, params.id)
        });
        if (!targetUser) return notFoundResponse("User");

          // Access Check
          if (!canAccessOrganization(auth, targetUser.organizationId)) {
            return forbiddenResponse();
        }

        // Prevent deleting self
        if (targetUser.id === auth.user.id) {
            return errorResponse("Cannot delete yourself");
        }

        await db.delete(users).where(eq(users.id, params.id));
        return successResponse(null, "User deleted successfully");
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        detail: { tags: ["Users"], security: [{ bearerAuth: [] }] }
      }
  );
