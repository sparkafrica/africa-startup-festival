export const EVENT_ROLE_VALUES = ["speaker", "mentor"] as const;

export type EventRole = (typeof EVENT_ROLE_VALUES)[number];

function normalizeRole(value: unknown): EventRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (normalized === "speaker") return "speaker";
  if (normalized === "mentor") return "mentor";
  return null;
}

function valuesFromUnknown(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record.value, record.name, record.label];
  }
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return valuesFromUnknown(JSON.parse(trimmed));
    } catch {
      // Fall through for legacy comma-delimited values.
    }
  }
  return trimmed.split(",");
}

/** Parse public event roles without reading professional job-title fields. */
export function parseEventRoles(value: unknown): EventRole[] {
  const roles: EventRole[] = [];
  for (const candidate of valuesFromUnknown(value)) {
    if (candidate && typeof candidate === "object") {
      for (const nested of valuesFromUnknown(candidate)) {
        const role = normalizeRole(nested);
        if (role && !roles.includes(role)) roles.push(role);
      }
      continue;
    }
    const role = normalizeRole(candidate);
    if (role && !roles.includes(role)) roles.push(role);
  }
  return roles;
}

/**
 * Explicit `event_roles` always wins. The legacy speaker flag is used only
 * during backend rollout so existing speakers do not temporarily lose badges.
 */
export function resolveEventRoles(
  explicitSources: unknown[],
  options?: { legacySpeaker?: boolean },
): EventRole[] {
  for (const source of explicitSources) {
    const parsed = parseEventRoles(source);
    if (parsed.length > 0) return parsed;
  }
  return options?.legacySpeaker ? ["speaker"] : [];
}

export function eventRoleLabel(role: EventRole): string {
  return role === "mentor" ? "Mentor" : "Speaker";
}

export function sessionSectionLabel(roles: EventRole[]): string {
  const isMentor = roles.includes("mentor");
  const isSpeaker = roles.includes("speaker");
  if (isMentor && !isSpeaker) return "Mentor Sessions";
  if (isSpeaker && !isMentor) return "Speaking Sessions";
  return "Sessions";
}
