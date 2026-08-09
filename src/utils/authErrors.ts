import { ApiClientError } from "../services/api";

/** Shown when POST /auth/email/ rejects an email with no ticket for the active event. */
export const OTP_NO_TICKET_ALERT = {
  title: "No ticket found",
  message:
    "You don't have a valid festival ticket. Please purchase one and return to login.",
} as const;

/**
 * Backend phrases for missing ticket / unknown email on OTP request.
 * Add new patterns here when the API copy changes (ATE vs ASF, per-event, etc.).
 */
const OTP_NO_TICKET_MESSAGE_PATTERNS: RegExp[] = [
  /user with this email does not exist/i,
  /does not exist/i,
  /do not have a ticket/i,
  /no ticket for this event/i,
  /no ticket found/i,
];

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message ?? "";
  }
  if (error instanceof Error) {
    return error.message ?? "";
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

/** True when POST /auth/email/ failed because the email has no ticket for this event. */
export function isOtpNoTicketError(error: unknown): boolean {
  const message = getApiErrorMessage(error);
  return OTP_NO_TICKET_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}
