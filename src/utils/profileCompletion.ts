/**
 * Profile Completion Utility
 *
 * Determines if a user profile is complete based on required fields.
 * Uses field-based inference since backend doesn't track completion status explicitly.
 */

import { UserProfile, Company } from "../services/authService";
import { TicketQuota } from "../services/ticketService";

/**
 * Check if personal profile fields are complete
 */
function isPersonalProfileComplete(user: UserProfile): boolean {
  // Required fields for personal profile
  const hasFirstName = user.first_name && user.first_name.trim().length >= 2;
  const hasLastName = user.last_name && user.last_name.trim().length >= 2;
  const hasJobTitle = user.job_title && user.job_title.trim().length >= 2;
  const hasBio = user.bio && user.bio.trim().length >= 10;
  const hasCountry = user.country && user.country.trim().length > 0;

  // Check if interests exist in metadata (required: at least 2)
  let hasInterests = false;
  if (user.metadata) {
    // Handle case where metadata might be a JSON string (backend might serialize it)
    let metadataObj: any;
    if (typeof user.metadata === "string") {
      try {
        metadataObj = JSON.parse(user.metadata);
      } catch (e) {
        console.warn("Failed to parse metadata as JSON:", e);
        metadataObj = null;
      }
    } else if (typeof user.metadata === "object") {
      metadataObj = user.metadata;
    }

    if (metadataObj && typeof metadataObj === "object") {
      const interests = metadataObj.interests;
      if (Array.isArray(interests) && interests.length >= 2) {
        hasInterests = true;
      }
    }
  }

  // Debug logging removed for production - uncomment if needed for debugging
  // console.log("Profile completion check:", {
  //   hasFirstName,
  //   hasLastName,
  //   hasJobTitle,
  //   hasBio,
  //   hasCountry,
  //   hasInterests,
  // });

  return (
    hasFirstName &&
    hasLastName &&
    hasJobTitle &&
    hasBio &&
    hasCountry &&
    hasInterests
  );
}

/**
 * Check if company profile fields are complete
 */
function isCompanyProfileComplete(
  company: Company | null | undefined,
): boolean {
  if (!company) {
    return false;
  }

  // Core company fields – backend may use company_description or description
  const hasName = company.name && company.name.trim().length >= 2;
  const hasSector =
    company.company_sector && company.company_sector.trim().length > 0;
  const hasCountry = company.country && company.country.trim().length > 0;
  const desc =
    company.company_description ?? (company as any).description ?? "";
  const hasDescription = typeof desc === "string" && desc.trim().length >= 10;

  // At least one of: description OR social links (backends vary; don't require both)
  let hasSocialLinks = false;
  let metadataObj: any = null;
  if (company.metadata) {
    if (typeof company.metadata === "string") {
      try {
        metadataObj = JSON.parse(company.metadata);
      } catch {
        metadataObj = null;
      }
    } else if (typeof company.metadata === "object") {
      metadataObj = company.metadata;
    }
  }
  if (metadataObj && typeof metadataObj === "object") {
    const metadata = metadataObj as any;
    const socialLinks = metadata.socialLinks;
    if (socialLinks && typeof socialLinks === "object") {
      hasSocialLinks = !!(
        socialLinks.linkedin ||
        socialLinks.facebook ||
        socialLinks.instagram ||
        socialLinks.x
      );
    }
    if (!hasSocialLinks) {
      hasSocialLinks = !!(
        metadata.linkedIn ||
        metadata.facebook ||
        metadata.instagram ||
        metadata.xHandle ||
        metadata.twitter
      );
    }
  }

  return (
    hasName &&
    hasSector &&
    hasCountry &&
    (hasDescription || hasSocialLinks)
  );
}

/**
 * Check if user has exhibitor/partner ticket type (requires company profile)
 */
export function requiresCompanyProfile(ticketQuotas: TicketQuota[]): boolean {
  const companyTicketTypes = ["exhibitor", "partner"];

  return ticketQuotas.some((quota) => {
    const type = quota.ticket_class?.type || quota.ticket_class?.user_type;
    return type && companyTicketTypes.includes(type.toLowerCase());
  });
}

/**
 * Determine if user profile is complete
 *
 * Rules:
 * - Personal profile is always required
 * - Company profile is required if:
 *   a) User has exhibitor/partner ticket type (determined by ticketQuotas), OR
 *   b) User already has a company associated
 *
 * @param user - User profile from backend
 * @param ticketQuotas - Optional array of ticket quotas to determine if company profile is required
 * @returns boolean indicating if profile is complete
 */
export function isProfileComplete(
  user: UserProfile,
  ticketQuotas?: TicketQuota[],
): boolean {
  // Personal profile is always required
  const personalComplete = isPersonalProfileComplete(user);

  // Determine if company profile is required
  const needsCompanyProfile = ticketQuotas
    ? requiresCompanyProfile(ticketQuotas)
    : !!user.company; // If no ticket quotas provided, fall back to checking if company exists

  // Debug logging removed for production - uncomment if needed for debugging
  // console.log("Profile completion check - needsCompanyProfile:", needsCompanyProfile);

  // If company profile is required, it must be complete
  if (needsCompanyProfile) {
    if (!user.company) {
      // User needs company profile but doesn't have one yet
      // Debug logging removed for production
      // console.log("❌ Profile incomplete: User requires company profile but company is null");
      return false;
    }
    const companyComplete = isCompanyProfileComplete(user.company);
    return personalComplete && companyComplete;
  }

  // If no company required, only personal profile is needed
  // Debug logging removed for production
  // console.log("✅ Profile complete: No company profile required");
  return personalComplete;
}
