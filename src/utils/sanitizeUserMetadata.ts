/**
 * Corrupted backend metadata can arrive as an object with keys "0","1","2",… (string spread of
 * JSON text on the server). That yields ~1 property per character — 200k+ keys.
 * Spreading that in JS (`{ ...user.metadata }`) hits Hermes:
 *   RangeError: Property storage exceeds 196601 properties
 *
 * Real profile metadata should be a small object (industry, interests, event_checklist, …).
 */

const MAX_METADATA_KEYS = 200;

function looksLikeIndexedCharCorruption(
  rec: Record<string, unknown>,
  keyCount: number
): boolean {
  if (keyCount < 20) return false;
  let numeric = 0;
  const sample: number[] = [];
  for (const k in rec) {
    if (!Object.prototype.hasOwnProperty.call(rec, k)) continue;
    if (/^\d+$/.test(k)) {
      numeric++;
      if (sample.length < 60) sample.push(Number(k));
    }
  }
  if (numeric / keyCount < 0.85) return false;
  sample.sort((a, b) => a - b);
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] !== i) return false;
  }
  return true;
}

/**
 * Safe object to merge new profile fields onto. Never spreads pathological metadata.
 */
export function getSafeMetadataObjectForMerge(raw: unknown): Record<string, unknown> {
  let obj: unknown = raw;
  if (obj == null) return {};
  if (typeof obj === "string") {
    const s = obj.trim();
    if (!s) return {};
    try {
      obj = JSON.parse(s);
    } catch {
      return {};
    }
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return {};
  }
  const rec = obj as Record<string, unknown>;
  let keyCount = 0;
  for (const _k in rec) {
    if (Object.prototype.hasOwnProperty.call(rec, _k)) {
      keyCount++;
      if (keyCount > MAX_METADATA_KEYS) {
        return {};
      }
    }
  }
  if (looksLikeIndexedCharCorruption(rec, keyCount)) {
    return {};
  }
  return rec;
}
