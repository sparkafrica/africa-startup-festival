/**
 * Normalize user metadata fields for safe UI rendering.
 * Backend / registration may store interests as plain strings or `{ label, value }` objects.
 */

type MetadataOption = { label?: unknown; value?: unknown };

function coerceMetadataItem(item: unknown): string | null {
  if (item == null) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || null;
  }
  if (typeof item === "number" || typeof item === "boolean") {
    return String(item);
  }
  if (typeof item === "object") {
    const o = item as MetadataOption;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const value = typeof o.value === "string" ? o.value.trim() : "";
    return label || value || null;
  }
  return null;
}

/** Single metadata label (industry, sector, etc.) — string or `{ label, value }`. */
export function coerceMetadataLabel(value: unknown): string | undefined {
  const item = coerceMetadataItem(value);
  return item ?? undefined;
}

/**
 * Metadata list (interests, experties, etc.) — strings, `{ label, value }`, or comma-separated string.
 * Returns display-safe strings only (never objects).
 */
export function coerceMetadataStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
      const text = coerceMetadataItem(item);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(text);
    }
    return out;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  const single = coerceMetadataItem(value);
  return single ? [single] : [];
}
