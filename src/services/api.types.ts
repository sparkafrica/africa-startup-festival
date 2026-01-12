/**
 * API Type Definitions
 *
 * Centralized type definitions for all API requests and responses.
 * Update these types as your backend API evolves.
 */

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface RequestVerificationCodeRequest {
  email: string;
}

export interface RequestVerificationCodeResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  userType?: "attendee" | "company" | "speaker" | "partner";
  hasCompletedProfile?: boolean;
  hasSeenWelcome?: boolean;
  // Profile type is defined in authService.ts (matches backend CustomUserDetails schema)
  profile?: any; // Use UserProfile from authService.ts when needed
  createdAt?: string;
  updatedAt?: string;
}

// NOTE: UserProfile interface moved to authService.ts
// It matches the backend CustomUserDetails schema with actual field names
// (user_id, first_name, etc.) instead of camelCase placeholders

// ============================================================================
// MEETING TYPES
// ============================================================================

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  participant: MeetingParticipant;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: "physical" | "virtual";
  meetingLink?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  direction: "inbound" | "outbound";
  expiresAt?: string;
  createdAt: string;
}

export interface MeetingParticipant {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  tags?: string[];
  interests?: string[];
  bio?: string;
  socialLabel?: string;
}

export interface RequestMeetingRequest {
  participantId: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: "physical" | "virtual";
  location?: string;
  meetingLink?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface Event {
  id: string;
  title: string;
  description?: string;
  stage: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  sponsoredBy?: {
    name: string;
    color: string;
  };
  speakers?: Speaker[];
  isAddedToSchedule?: boolean;
  capacity?: number;
  registeredCount?: number;
}

export interface Speaker {
  id: string;
  name: string;
  affiliation?: string;
  avatar?: string;
  bio?: string;
  sessions?: Event[];
}

// ============================================================================
// TICKET TYPES
// ============================================================================

export interface Ticket {
  id: string;
  ticketId: string;
  type: string;
  color: string;
  qrCode?: string;
  qrCodeData?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  isTransferable?: boolean;
  event?: {
    id: string;
    name: string;
    date: string;
  };
  createdAt?: string;
}

export interface TransferTicketRequest {
  recipientEmail: string;
  message?: string;
}

export interface ScanQRCodeRequest {
  qrCodeData: string;
}

export interface ScanQRCodeResponse {
  valid: boolean;
  ticket?: Ticket;
}

// ============================================================================
// ATTENDEE TYPES
// ============================================================================

export interface Attendee {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  bio?: string;
  industry?: string;
  country?: string;
  city?: string;
  tags?: string[];
  interests?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  socialLabel?: string;
  isConnected?: boolean;
  connectionStatus?: "pending" | "accepted" | null;
  mutualConnections?: number;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export interface Connection {
  id: string;
  user: Attendee;
  status: "pending" | "accepted";
  connectedAt?: string;
}

export interface RequestConnectionRequest {
  targetUserId: string;
  message?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: "meeting" | "connection" | "event" | "ticket";
  title: string;
  message: string;
  data?: {
    meetingId?: string;
    participantId?: string;
    connectionId?: string;
    eventId?: string;
    ticketId?: string;
  };
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// EXHIBITOR/PARTNER TYPES
// ============================================================================

export interface Exhibitor {
  id: string;
  name: string;
  logo?: string;
  logoColor?: string;
  description?: string;
  website?: string;
  tags?: string[];
}

// ============================================================================
// FEEDBACK TYPES
// ============================================================================

export interface EventFeedbackRequest {
  rating: number; // 1-5
  comment?: string;
}

export interface EventFeedbackResponse {
  success: boolean;
  message: string;
}
