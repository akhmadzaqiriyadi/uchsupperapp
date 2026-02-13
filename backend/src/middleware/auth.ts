import { eq } from "drizzle-orm";
import { db, users, organizations } from "../db";
import { extractToken, verifyToken } from "../lib/jwt";
import type { AuthContext, AuthUser } from "../types";

/**
 * Get authenticated user from Authorization header
 * Returns null if not authenticated
 */
export async function getAuthFromHeaders(
  authHeader: string | undefined
): Promise<AuthContext | null> {
  const token = extractToken(authHeader);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      organizationId: users.organizationId,
      organization: {
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        isCenter: organizations.isCenter,
      },
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) return null;

  return {
    user: user as AuthUser,
    payload,
  };
}

/**
 * Check if user has required role
 */
export function hasRole(
  auth: AuthContext | null,
  roles: ("SUPER_ADMIN" | "ADMIN_LINI" | "STAFF")[]
): boolean {
  if (!auth) return false;
  return roles.includes(auth.user.role);
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(auth: AuthContext | null): boolean {
  return hasRole(auth, ["SUPER_ADMIN"]);
}

/**
 * Check if user is Admin (Super Admin or Admin Lini)
 */
export function isAdmin(auth: AuthContext | null): boolean {
  return hasRole(auth, ["SUPER_ADMIN", "ADMIN_LINI"]);
}

/**
 * Check if user can access organization data
 */
export function canAccessOrganization(
  auth: AuthContext | null,
  organizationId: string
): boolean {
  if (!auth) return false;
  if (auth.user.role === "SUPER_ADMIN") return true;
  return auth.user.organizationId === organizationId;
}
