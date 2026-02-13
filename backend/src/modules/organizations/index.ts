import { Elysia, t } from "elysia";
import { eq, ilike, and, sql, desc, asc } from "drizzle-orm";
import { db, organizations, users } from "../../db";
import { getAuthFromHeaders, isSuperAdmin, canAccessOrganization } from "../../middleware";
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  notFoundResponse,
  conflictResponse,
  paginatedResponse,
  parsePaginationParams 
} from "../../utils";
import { getPresignedUrl, uploadToS3, generateS3Key, deleteFromS3 } from "../../lib/s3";

export const organizationsModule = new Elysia({ prefix: "/organizations" })
  /**
   * GET /api/organizations
   * List all organizations with pagination and search
   * Super Admin: sees all organizations
   * Others: sees only their own organization
   */
  .get(
    "/",
    async ({ query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { page, limit, offset } = parsePaginationParams(query.page, query.limit);
      const { search, isCenter } = query;

      // Non-super admin can only see their own org
      if (!isSuperAdmin(auth)) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, auth.user.organizationId))
          .limit(1);

        return paginatedResponse([org], 1, page, limit);
      }

      // Build conditions for Super Admin
      const conditions = [];

      if (search) {
        conditions.push(
          ilike(organizations.name, `%${search}%`)
        );
      }

      if (isCenter !== undefined) {
        conditions.push(eq(organizations.isCenter, isCenter));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      const [orgs, countResult] = await Promise.all([
        db
          .select()
          .from(organizations)
          .where(whereCondition)
          .orderBy(asc(organizations.name))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
          .where(whereCondition),
      ]);

      const orgsWithLogos = await Promise.all(orgs.map(async (org) => {
          if (org.logo) {
              return { ...org, logo: await getPresignedUrl(org.logo) };
          }
          return org;
      }));

      return paginatedResponse(orgsWithLogos, Number(countResult[0].count), page, limit);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        isCenter: t.Optional(t.BooleanString()),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "List Organizations",
        description: "Menampilkan daftar organisasi. Super Admin melihat semua, lainnya hanya melihat organisasinya sendiri.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of organizations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Organization" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/organizations/:id
   * Get organization detail by ID
   */
  .get(
    "/:id",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      if (!canAccessOrganization(auth, id)) {
        return forbiddenResponse();
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!org) {
        return notFoundResponse("Organization");
      }

      // Get user count for this organization
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.organizationId, id));

      if (org.logo) {
          org.logo = await getPresignedUrl(org.logo);
      }

      return successResponse({
        ...org,
        userCount: Number(userCount.count),
      });
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Get Organization Detail",
        description: "Mendapatkan detail organisasi berdasarkan ID.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Organization detail",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          allOf: [
                            { $ref: "#/components/schemas/Organization" },
                            {
                              type: "object",
                              properties: { userCount: { type: "integer" } },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: {
            description: "Not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * GET /api/organizations/:id/users
   * Get list of users in an organization with pagination
   */
  .get(
    "/:id/users",
    async ({ params, query, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { id } = params;

      if (!canAccessOrganization(auth, id)) {
        return forbiddenResponse();
      }

      const { page, limit, offset } = parsePaginationParams(query.page, query.limit);
      const { search, role } = query;

      // Build conditions
      const conditions = [eq(users.organizationId, id)];

      if (search) {
        conditions.push(
          ilike(users.name, `%${search}%`)
        );
      }

      if (role) {
        conditions.push(eq(users.role, role));
      }

      const whereCondition = and(...conditions);

      const [orgUsers, countResult] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(whereCondition)
          .orderBy(asc(users.name))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereCondition),
      ]);

      return paginatedResponse(orgUsers, Number(countResult[0].count), page, limit);
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        role: t.Optional(
          t.Union([
            t.Literal("SUPER_ADMIN"),
            t.Literal("ADMIN_LINI"),
            t.Literal("STAFF"),
          ])
        ),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "List Organization Users",
        description: "Menampilkan daftar user dalam organisasi.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/OrganizationUser" } },
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
   * POST /api/organizations
   * Create new organization (Super Admin only)
   */
  .post(
    "/",
    async ({ body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isSuperAdmin(auth)) {
        return forbiddenResponse("SUPER_ADMIN");
      }

      const { name, slug, isCenter, address, phone, email, website, logo } = body;

      // Check if slug already exists
      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug.toLowerCase()))
        .limit(1);

      if (existing) {
        return conflictResponse("Organization slug already exists");
      }

      const [newOrg] = await db
        .insert(organizations)
        .values({
          name,
          slug: slug.toLowerCase(),
          isCenter: isCenter || false,
          address: address,
          phone: phone,
          email: email,
          website: website,
          logo: logo,
        })
        .returning();

      return successResponse(newOrg, "Organization created successfully");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
        slug: t.String({ minLength: 2, maxLength: 50 }),
        isCenter: t.Optional(t.Boolean()),
        address: t.Optional(t.Nullable(t.String())),
        phone: t.Optional(t.Nullable(t.String())),
        email: t.Optional(t.Nullable(t.String())),
        website: t.Optional(t.Nullable(t.String())),
        logo: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Create Organization",
        description: "Membuat organisasi baru (Hanya Super Admin).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Organization created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/Organization" } },
                    },
                  ],
                },
              },
            },
          },
          409: {
            description: "Slug conflict",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * PUT /api/organizations/:id
   * Update organization (Super Admin only)
   */
  .put(
    "/:id",
    async ({ params, body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isSuperAdmin(auth)) {
        return forbiddenResponse("SUPER_ADMIN");
      }

      const { id } = params;
      const { name, slug, address, phone, email, website, logo } = body;

      // Check if org exists
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!existing) {
        return notFoundResponse("Organization");
      }

      // Check if new slug conflicts
      if (slug && slug.toLowerCase() !== existing.slug) {
        const [conflict] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.slug, slug.toLowerCase()))
          .limit(1);

        if (conflict) {
          return conflictResponse("Organization slug already in use");
        }
      }

      const [updated] = await db
        .update(organizations)
        .set({
          name: name ?? existing.name,
          slug: slug?.toLowerCase() ?? existing.slug,
          address: address === undefined ? existing.address : address,
          phone: phone === undefined ? existing.phone : phone,
          email: email === undefined ? existing.email : email,
          website: website === undefined ? existing.website : website,
          logo: logo === undefined ? existing.logo : logo,
        })
        .where(eq(organizations.id, id))
        .returning();

      return successResponse(updated, "Organization updated successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
        slug: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
        address: t.Optional(t.Nullable(t.String())),
        phone: t.Optional(t.Nullable(t.String())),
        email: t.Optional(t.Nullable(t.String())),
        website: t.Optional(t.Nullable(t.String())),
        logo: t.Optional(t.Nullable(t.String())),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Update Organization",
        description: "Update data organisasi (Hanya Super Admin).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Organization updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/Organization" } },
                    },
                  ],
                },
              },
            },
          },
          409: {
            description: "Slug conflict",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * DELETE /api/organizations/:id
   * Delete organization (Super Admin only, cannot delete if has users)
   */
  .delete(
    "/:id",
    async ({ params, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isSuperAdmin(auth)) {
        return forbiddenResponse("SUPER_ADMIN");
      }

      const { id } = params;

      // Check if org exists
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!existing) {
        return notFoundResponse("Organization");
      }

      // Cannot delete center organization
      if (existing.isCenter) {
        return errorResponse("Cannot delete the center organization");
      }

      // Check if org has users
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.organizationId, id));

      if (Number(userCount.count) > 0) {
        return errorResponse("Cannot delete organization with active users. Please remove all users first.");
      }

      // Delete logo from S3 if exists
      if (existing.logo) {
         await deleteFromS3(existing.logo);
      }

      await db.delete(organizations).where(eq(organizations.id, id));

      return successResponse(null, "Organization deleted successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Delete Organization",
        description: "Hapus organisasi (Hanya Super Admin). Tidak bisa dihapus jika masih ada user.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Organization deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          400: {
            description: "Cannot delete center ot has users",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    }
  )

  /**
   * POST /api/organizations/:id/logo
   * Upload organization logo
   */
  .post(
    "/:id/logo",
    async ({ params, body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isSuperAdmin(auth)) {
        return forbiddenResponse("SUPER_ADMIN");
      }

      const { id } = params;
      const { file } = body;

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!org) {
        return notFoundResponse("Organization");
      }

      // Delete old logo if exists
      if (org.logo) {
        await deleteFromS3(org.logo);
      }

      const s3Key = generateS3Key("logos", `${org.slug}-${Date.now()}-${file.name}`);
      const buffer = await file.arrayBuffer();

      await uploadToS3(s3Key, Buffer.from(buffer), file.type);

      await db
        .update(organizations)
        .set({ logo: s3Key })
        .where(eq(organizations.id, id));

      return successResponse({
        url: await getPresignedUrl(s3Key),
      }, "Logo uploaded successfully");
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        file: t.File({
          maxSize: "5m",
          type: ["image/jpeg", "image/png", "image/webp"],
        }),
      }),
      detail: {
        tags: ["Organizations"],
        summary: "Upload Organization Logo",
        description: "Upload logo organisasi (Max 5MB).",
        security: [{ bearerAuth: [] }],
      }
    }
  );
