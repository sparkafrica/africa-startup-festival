/**
 * Job Service
 *
 * Public job listings and active role links from companies.
 * Uses GET /jobs/ with X-SPARK-KEY only (no auth token) so that opening Talent Board
 * never triggers 401 → token refresh → logout in production.
 */

import axios from "axios";
import { ApiClientError } from "./api";
import { ENV, EVENT_ID, SPARK_API_KEY, getSparkKeyDiagnostics } from "../config/env";
import { trackEvent } from "../utils/analytics";

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
    const query = new URLSearchParams();
    if (params?.company_type) query.set("company_type", params.company_type);
    if (params?.event_ids) query.set("event_ids", params.event_ids);
    if (params?.search) query.set("search", params.search);
    const queryString = query.toString();
    const url = queryString ? `/jobs/?${queryString}` : "/jobs/";

    if (__DEV__ && !SPARK_API_KEY) {
      console.warn(
        "[TalentBoard jobService] X-SPARK-KEY is missing. Set EXPO_PUBLIC_SPARK_API_KEY (.env) or app.json extra / EAS secret for job listings.",
      );
    }

    try {
      // Use direct axios call without auth token so 401 on /jobs/ never triggers logout
      const axiosResponse = await axios.get<any>(`${ENV.BASE_URL}${url}`, {
        timeout: ENV.TIMEOUT,
        headers: {
          Accept: "application/json",
          ...(SPARK_API_KEY ? { "X-SPARK-KEY": SPARK_API_KEY } : {}),
        },
      });

      const data = axiosResponse?.data as any;

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
      const status =
        error?.response?.status ?? error?.response_code ?? error?.responseCode;
      const responseData = error?.response?.data ?? error?.data;
      const keyMeta = getSparkKeyDiagnostics();
      void trackEvent("public_endpoint_failed", {
        source: "talent_board",
        feature: "jobs",
        endpoint: "/jobs/",
        status: status ?? 0,
        message:
          status === 401
            ? "Invalid request try again later"
            : error?.response?.data?.message ??
              error?.message ??
              "Failed to fetch job listings",
        key_source: keyMeta.source,
        key_length: keyMeta.length,
        key_fingerprint: keyMeta.fingerprint,
        app_env: keyMeta.env,
      });
      if (__DEV__) {
        console.warn("[TalentBoard jobService] GET error", {
          message: error?.message,
          status,
          responseData:
            typeof responseData === "object"
              ? JSON.stringify(responseData)
              : responseData,
        });
      }
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message:
          status === 401
            ? "Invalid request try again later"
            : error?.response?.data?.message ??
              error?.message ??
              "Failed to fetch job listings",
        response_code: status ?? 500,
        data: {},
      });
    }
  },

  /**
   * Get jobs for the current event (convenience).
   */
  async getJobsForEvent(params?: {
    company_type?: string;
    search?: string;
  }): Promise<CompanyJobs[]> {
    return this.getJobs({
      ...params,
      event_ids: String(EVENT_ID),
    });
  },
};
