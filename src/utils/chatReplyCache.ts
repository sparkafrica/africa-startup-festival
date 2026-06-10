import type { ChatMessage, MessageReplyTo } from "../services/chatService";

/** Until backend returns reply_to on messages, keep quotes for sent replies locally. */
const replyByContentKey = new Map<string, MessageReplyTo>();

function cacheKey(conversationId: number, content: string): string {
  return `${conversationId}:${content.trim()}`;
}

export function rememberLocalReply(
  conversationId: number,
  content: string,
  replyTo: MessageReplyTo,
): void {
  replyByContentKey.set(cacheKey(conversationId, content), replyTo);
}

export function enrichMessagesWithLocalReplies(
  conversationId: number,
  messages: ChatMessage[],
): ChatMessage[] {
  return messages.map((m) => {
    if (m.reply_to?.content) return m;
    const cached = replyByContentKey.get(cacheKey(conversationId, m.content));
    if (!cached) return m;
    return {
      ...m,
      reply_to: cached,
      reply_to_message_id: cached.id,
    };
  });
}
