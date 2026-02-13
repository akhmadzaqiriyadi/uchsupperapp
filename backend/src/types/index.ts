// ========================
// API Response Types
// ========================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ========================
// Query Params Types
// ========================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  search?: string;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ========================
// Auth Types
// ========================

export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    isCenter: boolean;
  };
}

export interface AuthContext {
  user: AuthUser;
  payload: JWTPayload;
}

// ========================
// Financial Log Types
// ========================

export type LogType = "INCOME" | "EXPENSE";

export interface LogItem {
  itemName: string;
  quantity?: number;
  unitPrice: number;
}

export interface CreateLogPayload {
  type: LogType;
  description: string;
  totalAmount: number;
  items?: LogItem[];
}

export interface LogFilters extends PaginationParams, DateRangeParams, SearchParams {
  type?: LogType;
  organizationId?: string;
}

// ========================
// Organization Types
// ========================

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  isCenter?: boolean;
}

export interface OrganizationFilters extends PaginationParams, SearchParams {
  isCenter?: boolean;
}

// ========================
// User Types
// ========================

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organizationId?: string;
}

export interface UserFilters extends PaginationParams, SearchParams {
  role?: "SUPER_ADMIN" | "ADMIN_LINI" | "STAFF";
  organizationId?: string;
}

// ========================
// Dashboard Types
// ========================

export type SummaryPeriod = "week" | "month" | "year";

export interface DashboardSummary {
  period: SummaryPeriod;
  startDate: Date;
  endDate: Date;
  overall: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalLogs: number;
  };
  byOrganization: OrganizationSummary[];
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  logCount: number;
}

export interface OrganizationComparison {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  isCenter: boolean;
  logCount: number;
  lastActivity: Date | null;
  status: "ACTIVE" | "INACTIVE";
  daysSinceLastActivity: number | null;
}
