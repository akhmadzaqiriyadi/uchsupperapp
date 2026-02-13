import type { PaginationMeta } from "../types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Parse and validate pagination params
 */
export function parsePaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number; offset: number } {
  const validPage = Math.max(1, page || DEFAULT_PAGE);
  const validLimit = Math.min(MAX_LIMIT, Math.max(1, limit || DEFAULT_LIMIT));
  const offset = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    offset,
  };
}

/**
 * Build pagination meta object
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Build paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}
