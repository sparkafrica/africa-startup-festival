/**
 * FAQ index for App Guide search.
 * Search matches against: question + keywords + answer
 */
export interface FAQEntry {
  id: number;
  question: string;
  keywords: string[];
  answer: string;
}

export const FAQ_INDEX: FAQEntry[] = [
  {
    id: 1,
    question: "What is the ATE Event App?",
    keywords: [
      "ate app",
      "event app",
      "africa technology expo app",
      "event networking app",
      "expo app",
      "event companion app",
      "manage tickets",
      "connect attendees",
      "schedule meetings",
      "notifications",
    ],
    answer:
      "All-in-one digital companion for the event. Manage tickets, connect with attendees and speakers, schedule meetings, discover sessions, receive real-time notifications.",
  },
  {
    id: 2,
    question: "How do I log in to the app?",
    keywords: [
      "login",
      "log in",
      "sign in",
      "app login",
      "otp",
      "verification code",
      "email verification",
      "one time password",
      "6 digit code",
      "authentication",
      "access account",
      "no password",
      "cannot login",
      "didnt receive code",
      "no otp",
      "code not received",
    ],
    answer:
      "No password required. Enter email, request verification code, enter 6-digit OTP. Once verified you enter the app or review tickets for first-time users.",
  },
  {
    id: 3,
    question: "What happens the first time I log in?",
    keywords: [
      "first login",
      "first time login",
      "initial setup",
      "first time user",
      "review tickets",
      "setup profile",
      "assign quota",
    ],
    answer:
      "First-time users must review ticket allocation, assign any available quota tickets, complete required profile details. After setup, future logins go straight to the app.",
  },
  {
    id: 4,
    question: "What information is required on my profile?",
    keywords: [
      "profile",
      "complete profile",
      "profile requirements",
      "profile details",
      "edit profile",
      "linkedin",
      "profile photo",
      "bio",
      "job title",
      "company",
      "organisation",
      "country",
      "interests",
    ],
    answer:
      "Required: Full Name, Job Title, Company/Organisation, LinkedIn Profile. Optional: Profile Photo, Bio, Country, Interests.",
  },
  {
    id: 5,
    question: "How do I view my tickets?",
    keywords: [
      "my tickets",
      "view tickets",
      "personal ticket",
      "assigned tickets",
      "available tickets",
      "unassigned tickets",
      "menu",
      "scan tab",
    ],
    answer:
      "Go to Menu → My Ticket(s) or Scan → My Ticket. You see personal ticket, assigned tickets, available unassigned tickets.",
  },
  {
    id: 6,
    question: "How do I assign a ticket from my quota?",
    keywords: [
      "assign ticket",
      "ticket assignment",
      "allocate ticket",
      "ticket quota",
      "ticket recipient",
      "ticket invitation",
      "ticket allocation",
      "revoke ticket",
      "revoke assignment",
      "cannot assign ticket",
    ],
    answer:
      "Open Menu → My Ticket(s), select available ticket, enter recipient details, confirm. Recipient must accept. Revoking only possible before acceptance.",
  },
  {
    id: 7,
    question: "How do I transfer my personal ticket?",
    keywords: [
      "transfer ticket",
      "ticket transfer",
      "personal ticket transfer",
      "transfer ownership",
      "cannot transfer ticket",
      "transfer blocked",
      "irreversible",
      "lose event access",
    ],
    answer:
      "Only after all quota tickets are assigned. Go to Menu → My Ticket(s), select personal ticket, Transfer Ticket, enter recipient, confirm. Transfers are irreversible.",
  },
  {
    id: 8,
    question: "How does networking work?",
    keywords: [
      "networking",
      "attendees",
      "find attendees",
      "discover attendees",
      "recommended attendees",
      "all attendees",
      "attendees tab",
    ],
    answer:
      "Go to Attendees tab. All Attendees shows full list, Recommended shows curated suggestions. Connect or request meetings from either.",
  },
  {
    id: 9,
    question: "How do connections work?",
    keywords: [
      "connection request",
      "connect",
      "accept connection",
      "decline connection",
      "remove connection",
      "connections tab",
    ],
    answer:
      "Send connection request, other person accepts, they appear in Connections tab. From Connections you can request meetings. Accept or decline requests, remove connections.",
  },
  {
    id: 10,
    question: "How do meetings work?",
    keywords: [
      "meetings",
      "meeting request",
      "inbound",
      "outbound",
      "scheduled meetings",
      "meetings tab",
      "accept meeting",
      "reject meeting",
    ],
    answer:
      "Under Meetings → Requests: Inbound = requests sent to you (accept/reject). Outbound = requests you sent (pending). When accepted, moves to Scheduled for both.",
  },
  {
    id: 11,
    question: "Do meeting requests expire?",
    keywords: [
      "meeting expiration",
      "meeting expires",
      "meeting expired",
      "24 hour meeting",
      "meeting timeout",
      "meeting request expired",
    ],
    answer:
      "Yes. Pending requests show Expires in 24 hours. Respond before expiry. If expired, may no longer be available.",
  },
  {
    id: 12,
    question: "How do I request a meeting?",
    keywords: [
      "request meeting",
      "book meeting",
      "schedule meeting",
      "meeting reason",
      "meeting title",
      "virtual meeting",
      "meeting link",
      "meeting date",
      "meeting time",
    ],
    answer:
      "Request from Attendees, Connections, or scanned profile. Provide meeting title/reason, date and time, virtual link if applicable. Appears under Meetings → Requests → Outbound.",
  },
  {
    id: 13,
    question: "Why can't I request meetings?",
    keywords: [
      "cannot request meeting",
      "meeting disabled",
      "meeting restriction",
      "expo pass",
      "upgrade ticket",
    ],
    answer:
      "Some ticket types (e.g. Expo passes) do not include meeting privileges. If restricted, see alert with Upgrade Ticket option under My Ticket.",
  },
  {
    id: 14,
    question: "How does QR code scanning work?",
    keywords: [
      "scan",
      "qr code",
      "scan ticket",
      "scan attendee",
      "scan profile",
      "qr scanner",
      "scan badge",
    ],
    answer:
      "Use Scan feature to scan attendee ticket. After scanning you can view profile, connect, request meeting.",
  },
  {
    id: 15,
    question: "How do I browse event sessions?",
    keywords: [
      "schedule",
      "event schedule",
      "sessions",
      "browse sessions",
      "session list",
      "event agenda",
      "schedule tab",
    ],
    answer:
      "Go to Schedule tab. Browse sessions by day. Adding sessions to personal schedule coming soon.",
  },
  {
    id: 16,
    question: "What notifications will I receive?",
    keywords: [
      "notifications",
      "alerts",
      "push notifications",
      "meeting notifications",
      "ticket notifications",
      "connection notifications",
    ],
    answer:
      "Connection requests and approvals, meeting requests and responses, ticket allocations and transfers. Tap notification to go to relevant section.",
  },
  {
    id: 17,
    question: "Why can't I access the main app?",
    keywords: [
      "cannot access app",
      "app blocked",
      "profile incomplete",
      "mandatory profile fields",
      "cannot enter app",
    ],
    answer:
      "You may not have completed required profile fields. Restart app and complete all mandatory details.",
  },
  {
    id: 18,
    question: "Why can't I transfer my ticket?",
    keywords: [
      "cannot transfer ticket",
      "transfer blocked",
      "quota tickets remaining",
      "assign tickets first",
      "transfer unavailable",
    ],
    answer:
      "You likely still have available quota tickets. Assign all available tickets first, then transfer personal ticket.",
  },
  {
    id: 19,
    question: "Why didn't the recipient receive the ticket?",
    keywords: [
      "ticket not received",
      "recipient didnt get ticket",
      "ticket invitation missing",
      "accept ticket",
      "ticket notification",
    ],
    answer:
      "Recipient must accept ticket allocation notification before activation. Ask them to check app notifications and registered email.",
  },
  {
    id: 20,
    question: "I can't find my meeting request. Where is it?",
    keywords: [
      "meeting missing",
      "meeting not found",
      "cannot find meeting",
      "outbound meetings",
      "inbound meetings",
    ],
    answer:
      "Check Meetings → Requests → Outbound if you sent it. Check Inbound if it was sent to you.",
  },
  {
    id: 21,
    question: "What are the most important things to remember?",
    keywords: [
      "remember",
      "important",
      "transfers irreversible",
      "ticket acceptance",
      "revoke",
      "meeting access",
      "meeting expire",
      "profile accurate",
    ],
    answer:
      "Personal ticket transfers irreversible. Assigned tickets must be accepted. Revoking only before acceptance. Meeting access depends on ticket type. Meeting requests expire. Keep profile accurate.",
  },
];

/** Normalize text for search: lowercase, collapse apostrophes */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .trim();
}

/** Search FAQ index: matches question + keywords + answer. Supports fuzzy matching. */
export function searchGuide(
  query: string
): { section: number; title: string }[] {
  const q = normalizeForSearch(query);
  if (!q) return [];

  const results: { section: number; title: string }[] = [];
  const seen = new Set<number>();
  const queryWords = q.split(/\s+/).filter((w) => w.length > 0);

  for (const entry of FAQ_INDEX) {
    const searchableText =
      normalizeForSearch(entry.question) +
      " " +
      entry.keywords.map(normalizeForSearch).join(" ") +
      " " +
      normalizeForSearch(entry.answer);

    const matches =
      searchableText.includes(q) ||
      queryWords.every((word) => searchableText.includes(word));

    if (matches && !seen.has(entry.id)) {
      seen.add(entry.id);
      results.push({ section: entry.id, title: entry.question });
    }
  }

  results.sort((a, b) => a.section - b.section);
  return results;
}

/**
 * Browse-by-topic: map each chip label to the primary FAQ section (1–21)
 * so chips jump to the numbered section that is *about* that topic, not the
 * first place the word appears in the guide.
 */
export const TOPIC_TO_PRIMARY_SECTION: Record<string, number> = {
  tickets: 5,           // How do I view my tickets?
  login: 2,             // How do I log in to the app?
  profile: 4,           // What information is required on my profile?
  "assign ticket": 6,   // How do I assign a ticket from my quota?
  "transfer ticket": 7, // How do I transfer my personal ticket?
  meetings: 10,         // How do meetings work?
  scan: 14,             // How does QR code scanning work?
  connections: 9,       // How do connections work?
  attendees: 8,         // How does networking work?
};

/** Get the primary FAQ section id for a topic chip (1–21), or null. */
export function getTopicPrimarySection(topic: string): number | null {
  const key = topic.trim().toLowerCase();
  const section = TOPIC_TO_PRIMARY_SECTION[key];
  return section != null ? section : null;
}
