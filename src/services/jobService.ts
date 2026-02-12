/**
 * Job Service
 *
 * Public job listings and active role links from companies.
 * Uses GET /jobs/ (X-SPARK-KEY optional per backend).
 */

import { api } from "./api";
import { ApiClientError } from "./api";
import { EVENT_ID, SPARK_API_KEY } from "../config/env";

// ============================================================================
// TYPES (from Spark EMS.yaml - Public Job Listings)
// ============================================================================

export type JobItemType = "job_posting" | "active_role";

export interface JobItem {
  title: string;
  link: string;
  type: JobItemType;
}

export interface CompanyJobs {
  company_id: string;
  company_name: string;
  company_type: string;
  jobs: JobItem[];
}

// ============================================================================
// SERVICE
// ============================================================================

export const jobService = {
  /**
   * Get public job listings and active role links from companies.
   *
   * @param params - Optional filters: company_type, event_ids, search
   * @returns List of companies with their job postings and role links
   *
   * Backend: GET /jobs/
   * Query: company_type, event_ids (comma-separated), search
   */
  async getJobs(params?: {
    company_type?: string;
    event_ids?: string;
    search?: string;
  }): Promise<CompanyJobs[]> {
    try {
      const query = new URLSearchParams();
      if (params?.company_type) query.set("company_type", params.company_type);
      if (params?.event_ids) query.set("event_ids", params.event_ids);
      if (params?.search) query.set("search", params.search);
      const queryString = query.toString();
      const url = queryString ? `/jobs/?${queryString}` : "/jobs/";

      const headers: Record<string, string> = {};
      if (SPARK_API_KEY) headers["X-SPARK-KEY"] = SPARK_API_KEY;

      const response = await api.get<any>(url, headers ? { headers } : undefined);

      const data = response as any;

      if (Array.isArray(data)) {
        return data as CompanyJobs[];
      }
      if (data?.status === "success" && Array.isArray(data?.data)) {
        return data.data as CompanyJobs[];
      }
      if (data?.results && Array.isArray(data.results)) {
        return data.results as CompanyJobs[];
      }

      return [];
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch job listings",
        response_code: error?.response_code ?? 500,
        data: {},
      });
    }
  },

  /**
   * Get jobs for the current event (convenience).
   */
  async getJobsForEvent(params?: { company_type?: string; search?: string }): Promise<CompanyJobs[]> {
    return this.getJobs({
      ...params,
      event_ids: String(EVENT_ID),
    });
  },
};
