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
export { attendeeService } from "./attendeeService";
export type {
  Attendee as AttendeeBackend,
  AttendeeUser as AttendeeServiceUser,
  AttendeeTicket,
  AttendeeType,
  AttendeeFilters,
} from "./attendeeService";
export { ticketService } from "./ticketService";
export { companyService } from "./companyService";
export { connectionService } from "./connectionService";
export { meetingService } from "./meetingService";
export { jobService } from "./jobService";
export type { CompanyJobs, JobItem, JobItemType } from "./jobService";
export { offerService } from "./offerService";
export { boothService } from "./boothService";
export type { Booth } from "./boothService";
export type { PartnerOffer } from "./offerService";
