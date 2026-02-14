/**
 * Booth Service
 *
 * Fetches the authenticated user's exhibitor booth information for an event.
 * Booth number is assigned by the backend (e.g. after booth purchase) and is read-only in the app.
 *
 * YAML: GET /booths/{event_id}/user/ → schema Booth (booth_number: string | null)
 */

import { api } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// TYPES (from Spark EMS.yaml – Booth schema)
// ============================================================================

export interface Booth {
  id: number;
  event?: number | { id: number };
  booth_number?: string | null;
  user_email?: string;
  type?: unknown;
  addons?: unknown[];
  user_type?: string;
  success_manager?: string;
  quota?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export const boothService = {
  /**
   * Get the authenticated user's booth for an event.
   * Used to show read-only booth number in company profile (Manage Profile / Complete Profile).
   *
   * Backend: GET /booths/{event_id}/user/
   * Response: Booth (booth_number is string | null, maxLength 10)
   */
  async getMyBooth(eventId: number): Promise<{ booth_number: string | null }> {
    try {
      const response = await api.get<Booth>(`/booths/${eventId}/user/`);
      const raw = response as any;
      const data = raw?.data ?? raw;
      const boothNumber =
        data?.booth_number != null && data.booth_number !== ""
          ? String(data.booth_number)
          : null;
      return { booth_number: boothNumber };
    } catch (e: any) {
      if (e instanceof ApiClientError && e.responseCode === 404) {
        return { booth_number: null };
      }
      throw e;
    }
  },
};
