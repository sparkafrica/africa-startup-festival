import * as Haptics from "expo-haptics";

/** Ticket QR code validation (UUID format). */
export function validateTicketQrCode(
  code: string,
): { valid: boolean; error?: string } {
  const trimmed = code.trim();
  if (!trimmed) {
    return { valid: false, error: "Ticket code is required" };
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid ticket code format. Please enter a valid UUID.",
    };
  }
  return { valid: true };
}

export function triggerScanSuccessHaptic(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

export const SCAN_DEBOUNCE_MS = 1800;
