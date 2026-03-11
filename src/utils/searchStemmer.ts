/**
 * Lightweight stemmer and stopwords for App Guide search.
 * Stems word forms (e.g. transferring → transfer) so natural-language queries match FAQ content.
 */

/** Common stopwords to ignore when matching so "transferring of ticket" ≈ "transferring ticket". */
export const SEARCH_STOPWORDS = new Set(
  [
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
    "how", "i", "in", "is", "it", "its", "of", "on", "or", "that", "the", "to",
    "was", "we", "what", "when", "where", "which", "who", "why", "will", "with",
    "my", "me", "can", "do", "does", "did", "could", "would", "should", "this",
    "these", "those", "into", "out", "if", "then", "than", "so", "just", "about",
  ].map((w) => w.toLowerCase())
);

/**
 * Simple English stemmer. Reduces word forms to a common stem so
 * "transferring", "transferred", "transfer" all match content containing "transfer".
 * Uses suffix-stripping rules (Porter-inspired, simplified for search).
 */
export function stem(word: string): string {
  if (!word || word.length < 2) return word;
  const w = word.toLowerCase();

  // Already short or numeric
  if (w.length <= 3) return w;

  // -ing: transferring -> transfer, doing -> do (with optional e restoration)
  if (w.length > 5 && w.endsWith("ing")) {
    const base = w.slice(0, -3);
    if (hasVowel(base)) {
      if (base.length >= 2 && isDoubleConsonant(base)) return base.slice(0, -1);
      if (base.endsWith("i")) return base.slice(0, -1) + "y";
      return base;
    }
  }

  // -ed: transferred -> transfer, assigned -> assign
  if (w.length > 4 && w.endsWith("ed")) {
    const base = w.slice(0, -2);
    if (hasVowel(base)) {
      if (base.endsWith("e")) return base;
      if (base.length >= 2 && isDoubleConsonant(base)) return base.slice(0, -1);
      return base;
    }
  }

  // -er (comparative / agent): transfer stays, scanner -> scann -> scan (simplified: just strip)
  if (w.length > 4 && w.endsWith("er") && !w.endsWith("eer")) {
    const base = w.slice(0, -2);
    if (hasVowel(base) && base.length >= 2) return base;
  }

  // -ion: connection -> connect (remove -ion)
  if (w.length > 5 && w.endsWith("ion")) {
    const base = w.slice(0, -3);
    if (hasVowel(base)) return base;
  }

  // -ment: assignment -> assign, transfer -> (no change)
  if (w.length > 5 && w.endsWith("ment")) {
    const base = w.slice(0, -4);
    if (hasVowel(base)) return base;
  }

  // -ness, -ful, -ly: optional, skip for brevity

  // -es: tickets -> ticket, boxes -> box
  if (w.length > 3 && w.endsWith("es")) {
    const base = w.slice(0, -2);
    if (hasVowel(base)) return base;
  }

  // -s: tickets (if not -es) -> ticket, transfers -> transfer
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) {
    const base = w.slice(0, -1);
    if (hasVowel(base)) return base;
  }

  return w;
}

function hasVowel(s: string): boolean {
  return /[aeiouy]/.test(s);
}

function isDoubleConsonant(s: string): boolean {
  if (s.length < 2) return false;
  const c = s[s.length - 1];
  return c === s[s.length - 2] && /[bcdfgkmnprstvz]/.test(c);
}

/**
 * Tokenize, remove stopwords, and return stems for search.
 * Used for both query and for building searchable stem sets.
 */
export function tokenizeAndStem(
  text: string,
  options: { removeStopwords?: boolean } = {}
): string[] {
  const removeStopwords = options.removeStopwords ?? true;
  const tokens = text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const stems = tokens.map((t) => stem(t));
  if (removeStopwords) {
    return stems.filter((s) => !SEARCH_STOPWORDS.has(s));
  }
  return stems;
}
