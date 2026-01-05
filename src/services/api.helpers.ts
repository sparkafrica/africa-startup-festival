/**
 * API Helper Utilities
 *
 * Common utilities for working with the API client
 */

import { ApiClientError } from "./api";
import { Alert, Platform } from "react-native";

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    // Return the error message from the API
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Show error alert to user
 */
export function showErrorAlert(error: unknown, title = "Error"): void {
  const message = getErrorMessage(error);

  Alert.alert(title, message, [{ text: "OK" }]);
}

/**
 * Handle API error and show appropriate message
 */
export function handleApiError(
  error: unknown,
  customMessages?: Record<string, string>
): void {
  if (error instanceof ApiClientError) {
    const { code, statusCode } = error;

    // Check for custom messages
    if (customMessages && customMessages[code]) {
      Alert.alert("Error", customMessages[code]);
      return;
    }

    // Handle specific error codes
    switch (code) {
      case "NETWORK_ERROR":
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );
        break;

      case "UNAUTHORIZED":
      case "INVALID_TOKEN":
        Alert.alert("Session Expired", "Please log in again to continue.");
        // You can trigger logout here if needed
        break;

      case "VALIDATION_ERROR":
        Alert.alert("Validation Error", error.message);
        break;

      case "NOT_FOUND":
        Alert.alert("Not Found", "The requested resource was not found.");
        break;

      case "RATE_LIMIT_EXCEEDED":
        Alert.alert(
          "Too Many Requests",
          "Please wait a moment before trying again."
        );
        break;

      default:
        // Show the error message from the API
        Alert.alert("Error", error.message || "Something went wrong.");
    }
  } else {
    // Unknown error
    Alert.alert("Error", "An unexpected error occurred. Please try again.");
  }
}

// ============================================================================
// FORM DATA HELPERS
// ============================================================================

/**
 * Create FormData for file upload
 */
export function createFormData(
  fileUri: string,
  fieldName: string = "file",
  additionalData?: Record<string, string>
): FormData {
  const formData = new FormData();

  // Extract file extension
  const fileExtension = fileUri.split(".").pop() || "jpg";
  const fileName = `${fieldName}_${Date.now()}.${fileExtension}`;
  const mimeType = getMimeType(fileExtension);

  // Add file
  formData.append(fieldName, {
    uri: Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri,
    type: mimeType,
    name: fileName,
  } as any);

  // Add additional data
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return formData;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}

// ============================================================================
// QUERY PARAMETER HELPERS
// ============================================================================

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, String(item)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// DATE/TIME HELPERS
// ============================================================================

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse API date string to Date object
 */
export function parseAPIDate(dateString: string): Date {
  return new Date(dateString);
}
