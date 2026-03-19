/**
 * Shared rules for mandatory profile photos and company logos.
 * If the user taps "remove", they must pick a new image before save/submit is allowed.
 *
 * Why enforce on the backend too?
 * - Clients can be bypassed (older app builds, modified requests, API tools).
 * - Guarantees data quality for directories, cards, and moderation.
 * - Returns a clear 400 if someone omits or clears required media.
 * The app uses disabled submit + this helper; the API should still reject missing
 * profile_pic / company logo when your product rules require them.
 */

export const REQUIRED_PROFILE_PHOTO_MESSAGE =
  "Please upload a profile photo. If you removed your photo, choose a new image to continue.";

export const REQUIRED_COMPANY_LOGO_MESSAGE =
  "Please upload your company logo. If you removed the logo, choose a new image to continue.";

export type RequiredImageParams = {
  /** Local URI from image picker (new upload) */
  selectedUri: string | null | undefined;
  /** Existing URL from API (profile_pic, company.logo, etc.) */
  existingUrl: string | null | undefined;
  /** True after user chose "remove"; stays false once they pick a new image */
  shouldRemove: boolean;
};

/**
 * True when the user will have an image saved after submit:
 * - new local image selected, or
 * - existing server image kept (not removed).
 */
export function hasRequiredImage({
  selectedUri,
  existingUrl,
  shouldRemove,
}: RequiredImageParams): boolean {
  const trimmedUri = typeof selectedUri === "string" ? selectedUri.trim() : "";
  if (trimmedUri.length > 0) return true;
  if (shouldRemove) return false;
  const trimmedExisting =
    typeof existingUrl === "string" ? existingUrl.trim() : "";
  return trimmedExisting.length > 0;
}
