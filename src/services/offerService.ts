/**
 * Partner/Public Offers Service
 *
 * Public offers listings from partners, exhibitors, and companies.
 * Uses GET /offers/ with X-SPARK-KEY (same as jobs).
 *
 * Backend contract: see docs/PARTNER_OFFERS_API.md for request/response shape.
 */

import { api } from "./api";
import { ApiClientError } from "./api";
import { EVENT_ID, SPARK_API_KEY } from "../config/env";

// ============================================================================
// TYPES (frontend contract – backend should return data matching these)
// ============================================================================

export interface PartnerOffer {
  /** Unique offer id */
  id: string;
  /** Offer title (e.g. "20% off at Booth 42") */
  title: string;
  /** Short description (optional) */
  description?: string;
  /** Redemption or detail URL */
  link: string;
  /** Company/exhibitor/partner id */
  company_id: string;
  /** Display name of the company */
  company_name: string;
  /** e.g. "exhibitor" | "partner" (optional) */
  company_type?: string;
  /** e.g. "discount" | "promo" | "general" (optional, for pills/badges) */
  offer_type?: string;
  /** Optional image URL */
  image_url?: string;
  /** ISO date string if offer expires (optional) */
  valid_until?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const offerService = {
  /**
   * Get public partner/exhibitor offers for the app.
   *
   * @param params - Optional: company_type, event_ids, search
   * @returns List of PartnerOffer items
   *
   * Backend: GET /offers/
   * Query: company_type, event_ids (comma-separated), search
   * Header: X-SPARK-KEY (when set in .env)
   */
  async getOffers(params?: {
    company_type?: string;
    event_ids?: string;
    search?: string;
  }): Promise<PartnerOffer[]> {
    try {
      const query = new URLSearchParams();
      if (params?.company_type) query.set("company_type", params.company_type);
      if (params?.event_ids) query.set("event_ids", params.event_ids);
      if (params?.search) query.set("search", params.search);
      const queryString = query.toString();
      const url = queryString ? `/offers/?${queryString}` : "/offers/";

      const headers: Record<string, string> = {};
      if (SPARK_API_KEY) headers["X-SPARK-KEY"] = SPARK_API_KEY;

      const response = await api.get<any>(url, headers ? { headers } : undefined);

      const data = response as any;

      if (Array.isArray(data)) {
        return data as PartnerOffer[];
      }
      if (data?.status === "success" && Array.isArray(data?.data)) {
        return data.data as PartnerOffer[];
      }
      if (data?.results && Array.isArray(data.results)) {
        return data.results as PartnerOffer[];
      }

      return [];
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch offers",
        response_code: error?.response_code ?? 500,
        data: {},
      });
    }
  },

  /**
   * Get offers for the current event (convenience).
   */
  async getOffersForEvent(params?: { company_type?: string; search?: string }): Promise<PartnerOffer[]> {
    return this.getOffers({
      ...params,
      event_ids: String(EVENT_ID),
    });
  },
};
