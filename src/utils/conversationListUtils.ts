import type { ConversationListItem } from "../services/chatService";

/** Prefer `last_message.timestamp` when valid; else `updated_at`. */
export function getConversationRowTimestamp(item: ConversationListItem): string {
  const lm = item.last_message;
  if (lm && typeof lm === "object") {
    const ts = (lm as Record<string, unknown>).timestamp;
    if (typeof ts === "string" && ts.trim()) {
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) return ts.trim();
    }
  }
  return item.updated_at;
}

export function getConversationRowTimeMs(item: ConversationListItem): number {
  const t = new Date(getConversationRowTimestamp(item)).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** WhatsApp-style: most recent activity first. */
export function sortConversationsByRecent(
  list: ConversationListItem[],
): ConversationListItem[] {
  return [...list].sort(
    (a, b) => getConversationRowTimeMs(b) - getConversationRowTimeMs(a),
  );
}

/** Move a thread to the top after local send/receive (optimistic inbox bump). */
export function bumpConversationInList(
  list: ConversationListItem[],
  conversationId: number,
  patch?: Partial<Pick<ConversationListItem, "last_message" | "updated_at" | "unread_count">>,
): ConversationListItem[] {
  const idx = list.findIndex((c) => c.id === conversationId);
  if (idx < 0) return list;

  const nowIso = new Date().toISOString();
  const current = list[idx];
  const updated: ConversationListItem = {
    ...current,
    ...patch,
    updated_at: patch?.updated_at ?? nowIso,
    last_message:
      patch?.last_message ??
      (typeof current.last_message === "object" && current.last_message
        ? {
            ...(current.last_message as Record<string, unknown>),
            timestamp: nowIso,
          }
        : current.last_message),
  };

  const rest = list.filter((c) => c.id !== conversationId);
  return sortConversationsByRecent([updated, ...rest]);
}
