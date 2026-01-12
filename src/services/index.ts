/**
 * API Services - Main Export
 *
 * Central export point for all API-related functionality
 */

export { api } from "./api";
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationMeta,
  TokenResponse,
  ApiClientError,
} from "./api";

export * from "./api.types";
export * from "./api.helpers";

// Service layers
export * from "./authService";
export * from "./ticketService";
export * from "./companyService";
