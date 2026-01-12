/**
 * Company Service
 *
 * Service layer for company-related API calls.
 */

import { api } from "./api";
import { ApiResponse, ApiClientError } from "./api";
import { Company } from "./authService";

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
   * Update company details
   *
   * @param companyId - Company ID to update
   * @param companyData - Partial company data to update
   * @returns Promise that resolves with updated company data
   *
   * Backend Endpoint: PATCH /companies/{id}/
   */
  async updateCompany(
    companyId: number,
    companyData: CompanyUpdateRequest
  ): Promise<Company> {
    const response = await api.patch<CompanyUpdateRequest>(
      `/companies/${companyId}/`,
      companyData
    );

    if (response.status === "success" && response.data) {
      return response.data as Company;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to update company",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Upload company logo
   *
   * @param companyId - Company ID
   * @param imageUri - URI of the image to upload
   * @returns Promise that resolves with updated company data
   *
   * Backend Endpoint: PATCH /companies/{id}/
   * Content-Type: multipart/form-data (automatically set by axios for FormData)
   */
  async uploadCompanyLogo(
    companyId: number,
    imageUri: string
  ): Promise<Company> {
    console.log("🔧 uploadCompanyLogo called with:", { companyId, imageUri });
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();

    // Extract filename from URI (fallback to 'logo.jpg' if not available)
    const filename = imageUri.split("/").pop() || "logo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    console.log("🔧 FormData prepared:", { filename, type });

    // Append the image file
    // React Native FormData format: { uri, name, type }
    formData.append("logo", {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    console.log("🔧 Sending PATCH request to /companies/${companyId}/");
    
    // Use PATCH endpoint with FormData
    // Axios automatically detects FormData and sets Content-Type to multipart/form-data with boundary
    const response = await api.patch<FormData>(
      `/companies/${companyId}/`,
      formData
    );

    console.log("🔧 Response received:", response.status, response.response_code);

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
};
