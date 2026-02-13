import { Organization } from "@/features/organizations/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organizationId: string;
  organization?: Organization;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organizationId?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  password?: string;
  organizationId?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
  };
}
