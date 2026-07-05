/**
 * Normalize attendee payloads from scan / directory APIs for consistent UI rendering.
 * Mirrors AttendeesScreen + ConnectionsScreen metadata handling.
 */

import type { Attendee, AttendeeUser } from "../services/ticketService";
import { coerceMetadataLabel, coerceMetadataStringArray } from "./metadataCoerce";

/** Loose attendee shape from directory APIs (ticket may be partial). */
export type AttendeeLike = {
  ticket?: Attendee["ticket"] | Record<string, unknown>;
  user: AttendeeUser | (Record<string, unknown> & { id: string });
  match_info?: string | null;
};

export function parseUserMetadata(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

export function normalizeAttendeeUser(user: AttendeeUser): AttendeeUser {
  const metadata = parseUserMetadata(user.metadata);
  const interests = coerceMetadataStringArray(metadata.interests);

  return {
    ...user,
    job_title: user.job_title || user.organisation_role || undefined,
    metadata: {
      ...metadata,
      ...(interests.length > 0 ? { interests } : {}),
    },
  };
}

export function normalizeAttendee(attendee: Attendee): Attendee {
  return {
    ...attendee,
    user: normalizeAttendeeUser(attendee.user),
  };
}

/** Prefer enriched directory profile when scan response is sparse. */
export function mergeAttendeeProfiles(
  primary: Attendee,
  enriched: AttendeeLike | null | undefined,
): Attendee {
  if (!enriched) return normalizeAttendee(primary);

  const pUser = primary.user;
  const eUser = enriched.user as AttendeeUser;
  const mergedMeta = {
    ...parseUserMetadata(eUser.metadata),
    ...parseUserMetadata(pUser.metadata),
  };

  const mergedUser: AttendeeUser = {
    ...eUser,
    ...pUser,
    company: pUser.company ?? eUser.company,
    job_title:
      pUser.job_title ||
      eUser.job_title ||
      pUser.organisation_role ||
      eUser.organisation_role ||
      undefined,
    organisation: pUser.organisation ?? eUser.organisation ?? undefined,
    profile_pic: pUser.profile_pic ?? eUser.profile_pic,
    country: pUser.country ?? eUser.country,
    metadata: mergedMeta,
  };

  return normalizeAttendee({
    ...primary,
    ticket: primary.ticket,
    user: mergedUser,
    match_info: primary.match_info ?? enriched.match_info ?? null,
  });
}

export type AttendeeDisplayFields = {
  user: AttendeeUser;
  role: string;
  company: string;
  bio: string;
  interests: string[];
  industry: string | undefined;
  linkedInRaw: unknown;
  ticketTypeName: string;
  country: string;
};

export function getAttendeeDisplayFields(attendee: Attendee): AttendeeDisplayFields {
  const user = normalizeAttendeeUser(attendee.user);
  const meta = user.metadata as Record<string, unknown>;
  const industry = coerceMetadataLabel(
    meta.industry ?? meta.sector ?? user.company?.company_sector,
  );

  return {
    user,
    role: user.job_title || user.organisation_role || "",
    company: user.company?.name || user.organisation || "",
    bio: typeof meta.bio === "string" ? meta.bio : "",
    interests: coerceMetadataStringArray(meta.interests),
    industry,
    linkedInRaw: meta.linkedIn ?? meta.linkedin_url,
    ticketTypeName: attendee.ticket?.type?.name ?? "",
    country: user.country ?? "",
  };
}
