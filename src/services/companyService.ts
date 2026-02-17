/**
 * Company Service
 *
 * Service layer for company-related API calls.
 */

import { api } from "./api";
import { ApiResponse, ApiClientError } from "./api";
import { Company, readImageAsBase64 } from "./authService";

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

    if (imageUri) {
      const base64 = await readImageAsBase64(imageUri);
      if (base64) {
        const payload = { ...companyData, logo: base64 };
        try {
          const response = await api.put<CompanyUpdateRequest>(url, payload);
          if (response.status === "success" && response.data) {
            if (__DEV__) {
              console.log("✅ Company data + logo saved (PUT /companies/:id/)");
            }
            return response.data as Company;
          }
        } catch (e: any) {
          if (__DEV__) {
            console.warn("PUT with logo failed, trying PATCH with logo:", e?.message ?? e);
          }
        }
        try {
          const response = await api.patch<CompanyUpdateRequest>(url, payload);
          if (response.status === "success" && response.data) {
            if (__DEV__) {
              console.log("✅ Company data + logo saved (PATCH /companies/:id/)");
            }
            return response.data as Company;
          }
        } catch (e: any) {
          if (__DEV__) {
            console.warn("PATCH with logo failed, falling back to PATCH FormData:", e?.message ?? e);
          }
        }
      }
      return this._uploadCompanyLogoFormData(companyId, imageUri);
    }

    const response = await api.patch<CompanyUpdateRequest>(url, companyData);
    if (response.status === "success" && response.data) {
      if (__DEV__) {
        console.log("✅ Company data saved (PATCH /companies/:id/)");
      }
      return response.data as Company;
    }
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to update company",
      response_code: response.response_code,
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
  async uploadCompanyLogo(companyId: number, imageUri: string): Promise<Company> {
    return this.updateCompany(companyId, {}, { imageUri });
  },
};
