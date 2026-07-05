/**
 * Ticket transfer deadline — client-side gate (OTA-safe).
 * ASF v1: no client-side transfer cutoff; backend enforces policy.
 */

export function isTicketTransferDeadlinePassed(_now = Date.now()): boolean {
  return false;
}

export function isTicketTransferBlockedForEvent(_eventId: number): boolean {
  return false;
}

export function showTicketTransferDeadlineAlert(): void {
  // No-op for ASF v1
}
