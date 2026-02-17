/**
 * Partner/Public Offers Service
 *
 * - GET /offers/ (public): list for Partner Offers page. Uses X-SPARK-KEY.
 * - GET/POST/PATCH/DELETE /company-offers/ (auth): company admin manages offers;
 *   saving profile with Event Offers syncs here so GET /offers/ shows them.
 *
 * Backend contract: see docs/PARTNER_OFFERS_API.md and Spark EMS.yaml Offer schemas.
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

/** Backend Offer from GET /company-offers/ (paginated results). */
export interface CompanyOfferItem {
  id: number;
  title: string;
  link: string;
  description?: string | null;
  company_id?: string | number;
  company_name?: string;
  event?: number;
  offer_type?: string | null;
  is_active?: boolean;
}

/** Request body for POST /company-offers/ and PATCH /company-offers/{id}/. */
export interface CompanyOfferCreateUpdateRequest {
  title: string;
  link: string;
  company: number;
  event: number;
  description?: string | null;
  offer_type?: "discount" | "promo" | "general" | null;
  is_active?: boolean;
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

  // --------------------------------------------------------------------------
  // Company Offers (authenticated) – sync from profile save so GET /offers/ shows them
  // --------------------------------------------------------------------------

  /**
   * List offers for companies the current user administers.
   * Backend: GET /company-offers/ (paginated). Used to sync profile offers and to load form.
   */
  async listMyCompanyOffers(): Promise<CompanyOfferItem[]> {
    const response = await api.get<{ count?: number; results?: CompanyOfferItem[] }>(
      `/company-offers/?page_size=100`
    );
    const raw = response as any;
    const results = raw?.results ?? raw?.data?.results ?? (Array.isArray(raw?.data) ? raw.data : null);
    if (Array.isArray(results)) return results;
    return [];
  },

  /**
   * Create an offer for the user's company. Backend: POST /company-offers/.
   */
  async createCompanyOffer(body: CompanyOfferCreateUpdateRequest): Promise<CompanyOfferItem> {
    const response = (await api.post<CompanyOfferItem>("/company-offers/", body)) as any;
    const data = response?.data ?? response;
    if (data && typeof data.id === "number") return data as CompanyOfferItem;
    throw new ApiClientError({
      status: "error",
      message: "Invalid response from create offer",
      response_code: 500,
      data: {},
    });
  },

  /**
   * Update an offer. Backend: PATCH /company-offers/{id}/.
   */
  async updateCompanyOffer(
    id: number,
    body: Partial<CompanyOfferCreateUpdateRequest>
  ): Promise<CompanyOfferItem> {
    const response = (await api.patch<CompanyOfferItem>(`/company-offers/${id}/`, body)) as any;
    const data = response?.data ?? response;
    if (data && typeof data.id === "number") return data as CompanyOfferItem;
    throw new ApiClientError({
      status: "error",
      message: "Invalid response from update offer",
      response_code: 500,
      data: {},
    });
  },

  /**
   * Delete (deactivate) an offer. Backend: DELETE /company-offers/{id}/.
   */
  async deleteCompanyOffer(id: number): Promise<void> {
    await api.delete(`/company-offers/${id}/`);
  },

  /**
   * Sync profile offers to backend so GET /offers/ shows them on Partner Offers page.
   * Call after saving company profile. Creates new, updates existing (by id), deletes removed.
   * Skips offers with empty link (backend validates link). Normalizes link to URL format if needed.
   */
  async syncCompanyOffers(
    companyId: number,
    eventId: number,
    offers: Array<{ id?: string | number; title: string; link: string; color?: string }>
  ): Promise<void> {
    const existing = await this.listMyCompanyOffers();
    const existingIds = new Set(existing.map((o) => o.id));

    const normalizeLink = (link: string): string => {
      const s = link.trim();
      if (!s) return "";
      if (/^https?:\/\//i.test(s)) return s;
      return `https://${s}`;
    };

    const offersToSync = offers.filter((o) => {
      const link = normalizeLink(o.link);
      if (!link) {
        if (__DEV__) console.warn("Offer sync: skipping offer with empty link:", o.title);
        return false;
      }
      return true;
    });

    const ourBackendIds = new Set(
      offersToSync
        .filter((o) => typeof o.id === "number" && existingIds.has(o.id as number))
        .map((o) => o.id as number)
    );

    for (const offer of offersToSync) {
      const link = normalizeLink(offer.link);
      const payload: CompanyOfferCreateUpdateRequest = {
        title: offer.title.trim(),
        link,
        company: companyId,
        event: eventId,
        offer_type: "general",
      };
      try {
        if (typeof offer.id === "number" && existingIds.has(offer.id)) {
          await this.updateCompanyOffer(offer.id, payload);
        } else {
          await this.createCompanyOffer(payload);
        }
      } catch (err) {
        if (__DEV__) console.warn("Offer sync: failed for offer", offer.title, err);
        throw err;
      }
    }

    for (const id of existingIds) {
      if (!ourBackendIds.has(id)) await this.deleteCompanyOffer(id);
    }
  },
};
