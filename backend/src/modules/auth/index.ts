import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db, users, organizations } from "../../db";
import { comparePassword, hashPassword } from "../../lib/password";
import { generateToken } from "../../lib/jwt";
import { getAuthFromHeaders, isAdmin } from "../../middleware";
import { successResponse, errorResponse, unauthorizedResponse, conflictResponse } from "../../utils";

export const authModule = new Elysia({ prefix: "/auth" })
  /**
   * POST /api/auth/login
   * Login user dengan email dan password
   */
  .post(
    "/login",
    async ({ body }) => {
      const { email, password } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return errorResponse("Invalid email or password");
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return errorResponse("Invalid email or password");
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);

      const token = generateToken(user);

      return successResponse({
        token,
        tokenType: "Bearer",
        expiresIn: "7d",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            isCenter: org.isCenter,
          },
        },
      }, "Login successful");
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login User",
        description: "Login dengan email dan password untuk mendapatkan access token.",
        responses: {
          200: {
            description: "Successful login",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  /**
   * GET /api/auth/me
   * Get, current authenticated user profile
   */
  .get(
    "/me",
    async ({ headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      return successResponse({
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        organization: auth.user.organization,
      });
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get My Profile",
        description: "Mendapatkan profil user yang sedang login.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  /**
   * POST /api/auth/register
   * Register new user (Admin only)
   */
  .post(
    "/register",
    async ({ body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!isAdmin(auth)) {
        return errorResponse("Forbidden: Admin access required");
      }

      const { name, email, password, role, organizationId } = body;

      // Determine target organization
      let targetOrgId = organizationId || auth.user.organizationId;
      
      // Non-super admin can only register to own org
      if (auth.user.role !== "SUPER_ADMIN") {
        targetOrgId = auth.user.organizationId;
      }

      // Check if email already exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        return conflictResponse("Email is already registered");
      }

      // Verify target organization exists
      const [targetOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, targetOrgId))
        .limit(1);

      if (!targetOrg) {
        return errorResponse("Target organization not found");
      }

      const passwordHash = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: role || "STAFF",
          organizationId: targetOrgId,
        })
        .returning();

      return successResponse({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        organization: {
          id: targetOrg.id,
          name: targetOrg.name,
          slug: targetOrg.slug,
        },
      }, "User registered successfully");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 255 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6, maxLength: 128 }),
        role: t.Optional(
          t.Union([
            t.Literal("SUPER_ADMIN"),
            t.Literal("ADMIN_LINI"),
            t.Literal("STAFF"),
          ])
        ),
        organizationId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Register New User",
        description: "Mendaftarkan user baru (Hanya Admin).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  )

  /**
   * POST /api/auth/change-password
   * Change current user's password
   */
  .post(
    "/change-password",
    async ({ body, headers }) => {
      const auth = await getAuthFromHeaders(headers.authorization);
      if (!auth) {
        return unauthorizedResponse();
      }

      const { currentPassword, newPassword } = body;

      // Verify current password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.user.id))
        .limit(1);

      if (!user) {
        return errorResponse("User not found");
      }

      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return errorResponse("Current password is incorrect");
      }

      // Update password
      const newPasswordHash = await hashPassword(newPassword);
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, auth.user.id));

      return successResponse(null, "Password changed successfully");
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 6 }),
        newPassword: t.String({ minLength: 6, maxLength: 128 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Change Password",
        description: "Mengganti password user saat ini.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Password changed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          400: {
            description: "Invalid current password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    }
  );
