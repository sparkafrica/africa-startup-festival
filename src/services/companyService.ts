/**
 * Company Service
 *
 * Service layer for company-related API calls.
 */

import { api } from "./api";
import { ApiResponse, ApiClientError } from "./api";
import { Company, readImageAsBase64 } from "./authService";
import { authService } from "./authService";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Company Update Request
 * Matches backend schema: PatchedCompanyRequest (using PATCH for partial updates)
 */
export interface CompanyUpdateRequest {
  name?: string;
  contact_person?: string;
  country?: string;
  email?: string;
  phone?: string;
  company_sector?: string;
  company_description?: string;
  logo?: string | File | null;
  group_photo?: string | File | null;
  metadata?: any;
  company_type?: string;
  event_id?: number;
  founders?: Array<{
    first_name?: string;
    last_name?: string;
    email: string;
    job_title?: string | null;
    linkedin?: string | null;
    profile_pic?: string | null;
    phone_number?: string;
  }>;
}

export interface CreateCompanyRequest {
  name: string;
  country?: string;
  company_sector?: string;
  company_description?: string;
  company_type?: "startup" | "exhibitor" | "investor" | "partner" | "organisation";
  event_id?: number;
  metadata?: Record<string, unknown>;
  /** Spark EMS FounderRequest[] */
  founders?: Array<{
    first_name?: string;
    last_name?: string;
    email: string;
    job_title?: string | null;
    linkedin?: string | null;
    profile_pic?: string | null;
    phone_number?: string;
  }>;
}

// ============================================================================
// COMPANY SERVICE
// ============================================================================

export const companyService = {
  /**
   * Update company details. Optionally include logo in the same request (base64) so one PUT does everything.
   * If imageUri is provided, tries PUT with logo first; on failure falls back to PATCH with logo, then PATCH FormData.
   *
   * Backend: PUT or PATCH /companies/{id}/
   */
  async updateCompany(
    companyId: number,
    companyData: CompanyUpdateRequest,
    options?: { imageUri?: string },
  ): Promise<Company> {
    const imageUri = options?.imageUri;
    const url = `/companies/${companyId}/`;

    // Always persist company fields first (founders/metadata) so a logo-only
    // FormData fallback cannot drop the rest of the payload.
    const hasFieldUpdates = Object.keys(companyData).length > 0;
    let updated: Company | null = null;

    if (hasFieldUpdates) {
      const response = await api.patch<CompanyUpdateRequest>(url, companyData);
      if (response.status === "success" && response.data) {
        updated = response.data as Company;
      } else {
        throw new ApiClientError({
          status: "error",
          message: response.message || "Failed to update company",
          response_code: response.response_code,
          data: {},
        });
      }
    }

    if (imageUri) {
      const base64 = await readImageAsBase64(imageUri);
      if (base64) {
        try {
          const response = await api.patch<CompanyUpdateRequest>(url, {
            logo: base64,
          });
          if (response.status === "success" && response.data) {
            return response.data as Company;
          }
        } catch (e: any) {
          if (__DEV__) {
            console.warn(
              "PATCH logo base64 failed, falling back to FormData:",
              e?.message ?? e,
            );
          }
        }
      }
      return this._uploadCompanyLogoFormData(companyId, imageUri);
    }

    if (updated) return updated;

    throw new ApiClientError({
      status: "error",
      message: "Failed to update company",
      response_code: 0,
      data: {},
    });
  },

  /** PATCH with FormData (fallback when PUT/PATCH with base64 logo not supported). */
  async _uploadCompanyLogoFormData(
    companyId: number,
    imageUri: string,
  ): Promise<Company> {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "logo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("logo", {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const response = await api.patch<FormData>(
      `/companies/${companyId}/`,
      formData,
    );
    if (response.status === "success" && response.data) {
      return response.data as Company;
    }
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to upload company logo",
      response_code: response.response_code,
      data: {},
    });
  },

  /** @deprecated Use updateCompany(companyId, companyData, { imageUri }) instead. Kept for backwards compatibility. */
  async uploadCompanyLogo(
    companyId: number,
    imageUri: string,
  ): Promise<Company> {
    return this.updateCompany(companyId, {}, { imageUri });
  },

  /**
   * Remove the company logo on the server (`logo: null`).
   * Call when the admin removed the logo in the UI and is uploading a replacement in the same flow,
   * or if the backend allows clearing (client still enforces mandatory logo before save).
   */
  async clearCompanyLogo(companyId: number): Promise<Company> {
    const url = `/companies/${companyId}/`;
    const payload: CompanyUpdateRequest = { logo: null };

    try {
      const response = await api.patch<CompanyUpdateRequest>(url, payload);
      if (response.status === "success" && response.data) {
        return response.data as Company;
      }
    } catch (e: any) {
      if (__DEV__) {
        console.warn("PATCH logo null failed, trying PUT:", e?.message ?? e);
      }
    }

    try {
      const response = await api.put<CompanyUpdateRequest>(url, payload);
      if (response.status === "success" && response.data) {
        return response.data as Company;
      }
    } catch (e2: any) {
      if (__DEV__) {
        console.warn("PUT logo null failed:", e2?.message ?? e2);
      }
    }

    throw new ApiClientError({
      status: "error",
      message: "Failed to clear company logo",
      response_code: 0,
      data: {},
    });
  },

  /**
   * Create a new startup company. Caller becomes admin.
   * Backend: POST /companies/
   */
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await api.post<CreateCompanyRequest>("/companies/", {
      ...data,
      company_type: data.company_type ?? "startup",
    });
    if (response.status === "success" && response.data) {
      return response.data as Company;
    }
    const raw = response as unknown as Company;
    if (raw && typeof raw === "object" && "id" in raw) {
      return raw;
    }
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to create company",
      response_code: response.response_code || 500,
      data: {},
    });
  },

  /**
   * Request to join an existing company (pending until admin approves).
   * Backend: PATCH /auth/user/ with company_id.
   */
  async requestJoinCompany(companyId: number): Promise<void> {
    const { joinRequestService } = await import("./joinRequestService");
    await joinRequestService.createJoinRequest(companyId);
  },
};
