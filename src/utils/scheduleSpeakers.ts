import type { Speaker as ApiSpeaker } from "../services/eventService";
import type { Speaker as UiSpeaker } from "../components/EventViewModal";

/** Shape returned on schedule rows when speakers are embedded objects */
export type ScheduleEmbeddedSpeaker = Pick<
  ApiSpeaker,
  | "id"
  | "full_name"
  | "profile_pic"
  | "description"
  | "company"
  | "role"
  | "website_url"
  | "linkedin_url"
  | "twitter_handle"
>;

export function parseScheduleSpeakersRaw(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

export function mapEmbeddedSpeakerToUi(
  speaker: ScheduleEmbeddedSpeaker,
): UiSpeaker {
  return {
    id: String(speaker.id),
    name: speaker.full_name || "",
    affiliation: [speaker.role, speaker.company].filter(Boolean).join(" · ") || "",
    profilePic: speaker.profile_pic ?? null,
    bio: speaker.description || "",
    interests: [],
    tags: [],
    socialLabel: speaker.linkedin_url || speaker.website_url || "",
  };
}

export function mapCachedApiSpeakerToUi(speaker: ApiSpeaker): UiSpeaker {
  return {
    id: String(speaker.id),
    name: speaker.full_name || "",
    affiliation: [speaker.role, speaker.company].filter(Boolean).join(" · ") || "",
    profilePic: speaker.profile_pic ?? null,
    bio: speaker.description || "",
    interests: [],
    tags: [],
    socialLabel: speaker.linkedin_url || speaker.website_url || "",
  };
}

export function isEmbeddedScheduleSpeaker(
  item: unknown,
): item is ScheduleEmbeddedSpeaker {
  return (
    !!item &&
    typeof item === "object" &&
    "id" in item &&
    ("full_name" in item || "name" in item)
  );
}
