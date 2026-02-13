import type { ApiResponse } from "../types";

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Error response helper
 */
export function errorResponse(error: string, statusCode?: number): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(): ApiResponse<never> {
  return {
    success: false,
    error: "Unauthorized: Please provide a valid authentication token",
  };
}

/**
 * Forbidden response
 */
export function forbiddenResponse(requiredRole?: string): ApiResponse<never> {
  return {
    success: false,
    error: requiredRole 
      ? `Forbidden: This action requires ${requiredRole} role`
      : "Forbidden: You don't have permission to perform this action",
  };
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string): ApiResponse<never> {
  return {
    success: false,
    error: `${resource} not found`,
  };
}

/**
 * Validation error response
 */
export function validationErrorResponse(details: string): ApiResponse<never> {
  return {
    success: false,
    error: `Validation error: ${details}`,
  };
}

/**
 * Conflict response (for duplicate entries)
 */
export function conflictResponse(message: string): ApiResponse<never> {
  return {
    success: false,
    error: message,
  };
}
