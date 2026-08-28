/**
 * Single source of truth for ASF App Guide / FAQ content.
 * Canonical data lives in content/app-faq.json (share with website team).
 */
import appFaq from "../../content/app-faq.json";
import { tokenizeAndStem } from "../utils/searchStemmer";

export type FAQBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "warning"; items: string[] }
  | { type: "label"; text: string };

export interface FAQSection {
  id: number;
  slug: string;
  category: string;
  question: string;
  answerSummary: string;
  keywords: string[];
  body: FAQBodyBlock[];
}

export interface FAQBrowseTopic {
  label: string;
  sectionId: number;
}

export interface AppFaqDocument {
  meta: {
    title: string;
    subtitle: string;
    version: string;
    lastUpdated: string;
    event: string;
    webUrl: string;
    supportEmail: string;
  };
  browseTopics: FAQBrowseTopic[];
  sections: FAQSection[];
}

export const FAQ_DOCUMENT = appFaq as AppFaqDocument;
export const FAQ_SECTIONS = FAQ_DOCUMENT.sections;
export const FAQ_BROWSE_TOPICS = FAQ_DOCUMENT.browseTopics;

export interface FAQEntry {
  id: number;
  question: string;
  keywords: string[];
  answer: string;
}

/** Search index derived from JSON sections. */
export const FAQ_INDEX: FAQEntry[] = FAQ_SECTIONS.map((s) => ({
  id: s.id,
  question: s.question,
  keywords: s.keywords,
  answer: s.answerSummary,
}));

export const SECTION_TITLES: Record<number, string> = Object.fromEntries(
  FAQ_SECTIONS.map((s) => [s.id, s.question]),
);

const DIVIDER = "________________";

function blockToLines(block: FAQBodyBlock): string[] {
  switch (block.type) {
    case "paragraph":
      return block.text.split("\n");
    case "label":
      return [block.text];
    case "bullets":
      return block.items.map((item) => `* ${item}`);
    case "numbered":
      return block.items.map((item, i) => `${i + 1}. ${item}`);
    case "warning":
      return ["⚠️ Important:", ...block.items.map((item) => `* ${item}`)];
    default:
      return [];
  }
}

/** Flat text string for AppGuideScreen (legacy renderer). */
export function buildAppGuideContent(): string {
  const { meta, sections } = FAQ_DOCUMENT;
  const lines: string[] = [
    meta.title,
    meta.subtitle,
    DIVIDER,
    "",
  ];

  for (const section of sections) {
    lines.push(`${section.id}. ${section.question}`);
    for (const block of section.body) {
      lines.push(...blockToLines(block));
    }
    lines.push(DIVIDER, "");
  }

  return lines.join("\n");
}

export const APP_GUIDE_CONTENT = buildAppGuideContent();

/** Extra keyword aliases → section ids (search expansion beyond per-section keywords). */
const KEYWORD_ALIASES: Record<string, number[]> = {
  ticket: [5, 6, 7, 13, 18, 19, 22, 23],
  tickets: [5, 6, 7, 13, 18, 19, 22, 23],
  "my ticket": [5, 6, 7, 23],
  "personal ticket": [5, 6, 7, 23],
  "assign ticket to someone": [6],
  "ticket invitation": [6, 19],
  "accept ticket": [6, 7, 19, 22],
  "ticket acceptance": [6, 7, 22],
  "pending ticket": [6],
  "edit ticket assignment": [6],
  "transfer personal ticket": [7],
  "ticket transfer rules": [7],
  "transfer recipient": [7],
  "ticket holder": [7],
  "irreversible transfer": [7],
  "enter app": [2, 17],
  "verification email": [2],
  "login code": [2],
  "profile visibility": [4],
  "update profile": [4],
  "profile information": [4],
  "linkedin url": [4],
  "linkedin username": [4],
  "attendee list": [8],
  "professional networking": [8],
  "event attendees": [8],
  "meeting invite": [12],
  "meeting requests": [10, 11, 12, 20],
  "inbound requests": [10],
  "outbound requests": [10],
  "requests tab": [10],
  "inbound tab": [10],
  "outbound tab": [10],
  "can't login": [2],
  "didn't receive code": [2],
  "verification failed": [2],
  "can't transfer ticket": [7, 18],
  "can't assign ticket": [6],
  "recipient did not receive ticket": [19],
  "can't request meeting": [13],
  "meeting disabled": [13],
  "can't enter app": [17],
  "meeting not showing": [20],
  "meetings tab": [10],
  "connections tab": [9],
  "attendees tab": [8],
  "schedule tab": [15],
  "scan tab": [5, 14],
  menu: [5, 6, 7, 23, 27],
  event: [1],
  expo: [1],
  "africa startup festival": [1],
  "asf event": [1],
  "event networking": [1],
  "session day": [15],
  "app alerts": [16],
  "push notifications": [16],
  alerts: [16],
  "scan qr": [14],
  "upgrade pass": [23],
  inbox: [24],
  chat: [24],
  dm: [24],
  "direct message": [24],
  "cannot message": [24],
  "startup join": [25],
  "join request": [25],
  "startup badge": [25],
  "startup admin": [25],
  "no ticket found": [26],
  "purchase ticket": [26],
  "app suggestions": [27],
  "session feedback": [27],
  "meeting feedback": [27],
  startups: [25],
};

function buildKeywordToSections(): Record<string, number[]> {
  const map: Record<string, number[]> = { ...KEYWORD_ALIASES };

  for (const section of FAQ_SECTIONS) {
    for (const kw of section.keywords) {
      const key = kw.toLowerCase();
      if (!map[key]) map[key] = [];
      if (!map[key].includes(section.id)) map[key].push(section.id);
    }
  }

  const allIds = FAQ_SECTIONS.map((s) => s.id);
  for (const key of ["help", "support", "faq", "guide", "how to", "how do i", "where do i", "why can't i"]) {
    map[key] = [...allIds];
  }

  for (const id of Object.keys(map)) {
    map[id].sort((a, b) => a - b);
  }

  return map;
}

export const KEYWORD_TO_SECTIONS = buildKeywordToSections();

export const TOPIC_TO_PRIMARY_SECTION: Record<string, number> =
  Object.fromEntries(
    FAQ_BROWSE_TOPICS.map((t) => [t.label.toLowerCase(), t.sectionId]),
  );

export const POPULAR_TOPIC_LABELS = FAQ_BROWSE_TOPICS.map((t) => t.label);

function normalizeForSearch(text: string): string {
  return text.toLowerCase().replace(/[''`]/g, "").trim();
}

export function searchGuide(
  query: string,
): { section: number; title: string }[] {
  const q = normalizeForSearch(query);
  if (!q) return [];

  const seen = new Set<number>();
  const results: { section: number; title: string }[] = [];
  const queryStems = tokenizeAndStem(q, { removeStopwords: true });

  for (const [keyword, sectionIds] of Object.entries(KEYWORD_TO_SECTIONS)) {
    const kwNorm = normalizeForSearch(keyword);
    const kwStems = tokenizeAndStem(kwNorm, { removeStopwords: true });
    const overlap =
      kwNorm.includes(q) ||
      q.includes(kwNorm) ||
      (queryStems.length > 0 && queryStems.some((qs) => kwStems.includes(qs)));
    if (overlap) {
      for (const id of sectionIds) {
        if (!seen.has(id)) {
          seen.add(id);
          results.push({ section: id, title: SECTION_TITLES[id] ?? "" });
        }
      }
    }
  }

  for (const entry of FAQ_INDEX) {
    if (seen.has(entry.id)) continue;
    const searchableText =
      normalizeForSearch(entry.question) +
      " " +
      entry.keywords.map(normalizeForSearch).join(" ") +
      " " +
      normalizeForSearch(entry.answer);
    const searchableStems = new Set(
      tokenizeAndStem(searchableText, { removeStopwords: true }),
    );

    const fullPhraseMatch = searchableText.includes(q);
    const allStemsMatch =
      queryStems.length > 0 &&
      queryStems.every((s) => searchableStems.has(s));

    if (fullPhraseMatch || allStemsMatch) {
      seen.add(entry.id);
      results.push({ section: entry.id, title: entry.question });
    }
  }

  results.sort((a, b) => a.section - b.section);
  return results;
}

export function getTopicPrimarySection(topic: string): number | null {
  const key = topic.trim().toLowerCase();
  const section = TOPIC_TO_PRIMARY_SECTION[key];
  return section != null ? section : null;
}

/** Re-export raw JSON document for website sync / tooling. */
export function getFaqDocumentForWeb(): AppFaqDocument {
  return FAQ_DOCUMENT;
}
