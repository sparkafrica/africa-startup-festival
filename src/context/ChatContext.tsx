/**
 * ChatContext – central state for 1:1 in-app messaging.
 * Holds messages per conversation and exposes load/send/getOrCreate.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import { useAuth } from "./AuthContext";
import {
  getRecentMessages,
  sendMessage as sendChatMessage,
  getOrCreateConversation as getOrCreateConversationApi,
  markConversationRead,
  type ChatMessage,
  type ConversationDetail,
  type MessageReplyTo,
} from "../services/chatService";
import { emitInboxBump, emitInboxRead } from "../utils/chatInboxSync";
import {
  enrichMessagesWithLocalReplies,
  rememberLocalReply,
} from "../utils/chatReplyCache";
import { ApiClientError } from "../services/api";
import {
  subscribeToConversationChannel,
  unsubscribeFromConversationChannel,
  isChatNewMessageEvent,
} from "../services/pusherChatService";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ChatContextType {
  /** Messages keyed by conversation id (backend conversation id) */
  messagesByConversationId: Record<number, LocalChatMessage[]>;
  /** Loading flag for the current conversation (e.g. loading messages) */
  loading: boolean;
  /** Error message to show (e.g. send failed) */
  error: string | null;
  /** Clear any stored error */
  clearError: () => void;
  /** Load messages for a conversation (fetches and stores in state) */
  loadConversation: (eventId: number, conversationId: number) => Promise<void>;
  /** Silent refresh — no loading spinner (Android poll / Pusher fallback). */
  refreshConversation: (eventId: number, conversationId: number) => Promise<void>;
  /** Send a text message and append to state on success */
  sendMessage: (
    eventId: number,
    conversationId: number,
    content: string,
    options?: { replyTo?: MessageReplyTo },
  ) => Promise<void>;
  /** Get or create a 1:1 conversation; returns conversation id and detail (does not load messages) */
  getOrCreateConversation: (
    eventId: number,
    otherUserId: string
  ) => Promise<{ conversationId: number; detail: ConversationDetail }>;
  /** Subscribe to realtime events for one conversation */
  bindConversationRealtime: (eventId: number, conversationId: number) => Promise<void>;
  /** Unsubscribe realtime events for one conversation */
  unbindConversationRealtime: (conversationId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type LocalMessageStatus = "pending" | "failed";
export type LocalChatMessage = ChatMessage & {
  client_status?: LocalMessageStatus;
  client_temp_id?: string;
  client_error?: string;
};

interface OutboxItem {
  tempId: string;
  tempMessageId: number;
  eventId: number;
  conversationId: number;
  content: string;
  attempts: number;
  replyToMessageId?: number;
  replyTo?: MessageReplyTo;
}

function parseNewMessageFromPusher(raw: unknown): ChatMessage | null {
  let parsed: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw as Record<string, unknown>;
  }
  if (!parsed) return null;

  const msgId = Number(parsed.id);
  const content = typeof parsed.content === "string" ? parsed.content : "";
  const timestamp =
    typeof parsed.timestamp === "string"
      ? parsed.timestamp
      : new Date().toISOString();

  if (!Number.isFinite(msgId) || !content) return null;

  let reply_to: MessageReplyTo | undefined;
  const rawReply = parsed.reply_to;
  if (rawReply && typeof rawReply === "object") {
    const replyObj = rawReply as Record<string, unknown>;
    const rid = Number(replyObj.id);
    const rcontent =
      typeof replyObj.content === "string" ? replyObj.content : "";
    const rname =
      typeof replyObj.sender_name === "string" ? replyObj.sender_name : "";
    if (Number.isFinite(rid) && rcontent) {
      reply_to = { id: rid, content: rcontent, sender_name: rname };
    }
  }

  return {
    id: msgId,
    content,
    timestamp,
    is_read: Boolean(parsed.is_read),
    sender_name:
      typeof parsed.sender_name === "string" ? parsed.sender_name : "",
    sender_email:
      typeof parsed.sender_email === "string" ? parsed.sender_email : "",
    sender_profile_pic:
      typeof parsed.sender_profile_pic === "string"
        ? parsed.sender_profile_pic
        : "",
    file_attachments: Array.isArray(parsed.file_attachments)
      ? parsed.file_attachments
      : [],
    file_type:
      typeof parsed.file_type === "string" ? parsed.file_type : undefined,
    reply_to,
    reply_to_message_id:
      typeof parsed.reply_to_message_id === "number"
        ? parsed.reply_to_message_id
        : reply_to?.id,
  };
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const [messagesByConversationId, setMessagesByConversationId] = useState<
    Record<number, LocalChatMessage[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRealtimeConversationIdsRef = useRef<Set<number>>(new Set());
  const androidThreadRefetchTimersRef = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());
  const outboxRef = useRef<Record<number, OutboxItem[]>>({});
  const processingConversationIdsRef = useRef<Set<number>>(new Set());

  const clearError = useCallback(() => setError(null), []);

  const upsertIncomingMessage = useCallback(
    (conversationId: number, incoming: LocalChatMessage) => {
      let isNew = false;
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const idx = current.findIndex((m) => m.id === incoming.id);
        if (idx >= 0) {
          const copy = [...current];
          copy[idx] = { ...copy[idx], ...incoming };
          return { ...prev, [conversationId]: copy };
        }
        isNew = true;
        return { ...prev, [conversationId]: [...current, incoming] };
      });
      if (isNew) {
        emitInboxBump({
          conversationId,
          content: incoming.content,
          timestamp: incoming.timestamp,
        });
      }
    },
    []
  );

  const updateTempMessage = useCallback(
    (
      conversationId: number,
      tempMessageId: number,
      patch: Partial<LocalChatMessage>
    ) => {
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const idx = current.findIndex((m) => m.id === tempMessageId);
        if (idx < 0) return prev;
        const copy = [...current];
        copy[idx] = { ...copy[idx], ...patch };
        return { ...prev, [conversationId]: copy };
      });
    },
    []
  );

  const removeTempMessage = useCallback(
    (conversationId: number, tempMessageId: number) => {
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const filtered = current.filter((m) => m.id !== tempMessageId);
        return { ...prev, [conversationId]: filtered };
      });
    },
    []
  );

  const mergeServerMessagesPreservingLocal = useCallback(
    (conversationId: number, serverMessages: ChatMessage[]) => {
      const enriched = enrichMessagesWithLocalReplies(
        conversationId,
        serverMessages,
      );
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const localPendingOrFailed = current.filter(
          (m) => m.client_status === "pending" || m.client_status === "failed",
        );
        return {
          ...prev,
          [conversationId]: [...enriched, ...localPendingOrFailed],
        };
      });
    },
    [],
  );

  const processOutboxForConversation = useCallback(
    async (conversationId: number) => {
      if (processingConversationIdsRef.current.has(conversationId)) return;
      const queue = outboxRef.current[conversationId];
      if (!queue || queue.length === 0) return;

      processingConversationIdsRef.current.add(conversationId);
      try {
        while (outboxRef.current[conversationId]?.length) {
          const item = outboxRef.current[conversationId][0];
          try {
            await sendChatMessage(item.eventId, item.conversationId, item.content, {
              replyToMessageId: item.replyToMessageId,
            });
            outboxRef.current[conversationId].shift();
            removeTempMessage(conversationId, item.tempMessageId);

            const serverMessages = await getRecentMessages(item.eventId, item.conversationId);
            mergeServerMessagesPreservingLocal(conversationId, serverMessages);
          } catch (err: any) {
            item.attempts += 1;
            const retryDelayMs = Math.min(1000 * 2 ** Math.max(item.attempts - 1, 0), 10000);

            if (item.attempts >= 3) {
              // Mark failed and drop from active queue; user can resend manually.
              outboxRef.current[conversationId].shift();
              updateTempMessage(conversationId, item.tempMessageId, {
                client_status: "failed",
                client_error: err?.message || "Failed to send",
              });
              setError("Some messages failed to send.");
            } else {
              updateTempMessage(conversationId, item.tempMessageId, {
                client_status: "pending",
              });
              setTimeout(() => {
                void processOutboxForConversation(conversationId);
              }, retryDelayMs);
              break;
            }
          }
        }
      } finally {
        processingConversationIdsRef.current.delete(conversationId);
      }
    },
    [
      mergeServerMessagesPreservingLocal,
      removeTempMessage,
      updateTempMessage,
    ]
  );

  const loadConversation = useCallback(
    async (eventId: number, conversationId: number) => {
      setLoading(true);
      setError(null);
      try {
        const messages = await getRecentMessages(eventId, conversationId);
        const enriched = enrichMessagesWithLocalReplies(
          conversationId,
          messages,
        );
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: [
            ...enriched,
            ...(prev[conversationId] ?? []).filter(
              (m) => m.client_status === "pending" || m.client_status === "failed",
            ),
          ],
        }));
      } catch (err: any) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load messages.";
        setError(msg);
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
          tags: { area: "chat_rest", action: "load_conversation" },
          extra: { eventId, conversationId, message: err?.message },
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Background merge for Android realtime fallback — no loading spinner. */
  const refreshConversationMessages = useCallback(
    async (eventId: number, conversationId: number) => {
      try {
        const messages = await getRecentMessages(eventId, conversationId);
        const enriched = enrichMessagesWithLocalReplies(
          conversationId,
          messages,
        );
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: [
            ...enriched,
            ...(prev[conversationId] ?? []).filter(
              (m) =>
                m.client_status === "pending" || m.client_status === "failed",
            ),
          ],
        }));
      } catch {
        /* optimistic upsert remains; next focus load reconciles */
      }
    },
    [],
  );

  const scheduleAndroidThreadRefetch = useCallback(
    (eventId: number, conversationId: number) => {
      if (Platform.OS !== "android") return;
      const timers = androidThreadRefetchTimersRef.current;
      const pending = timers.get(conversationId);
      if (pending) clearTimeout(pending);
      timers.set(
        conversationId,
        setTimeout(() => {
          timers.delete(conversationId);
          void refreshConversationMessages(eventId, conversationId);
        }, 400),
      );
    },
    [refreshConversationMessages],
  );

  const sendMessage = useCallback(
    async (
      eventId: number,
      conversationId: number,
      content: string,
      options?: { replyTo?: MessageReplyTo },
    ) => {
      setError(null);
      const trimmed = content.trim();
      if (!trimmed) return;

      const now = Date.now();
      const tempMessageId = -now;
      const tempId = `temp_${conversationId}_${now}`;
      const timestamp = new Date(now).toISOString();
      const optimisticMessage: LocalChatMessage = {
        id: tempMessageId,
        content: trimmed,
        timestamp,
        is_read: false,
        sender_name:
          [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
          user?.email ||
          "You",
        sender_email: user?.email || "",
        sender_profile_pic: user?.profile_pic || "",
        file_attachments: [],
        file_type: undefined,
        reply_to: options?.replyTo,
        reply_to_message_id: options?.replyTo?.id,
        client_status: "pending",
        client_temp_id: tempId,
      };

      setMessagesByConversationId((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage],
      }));

      if (options?.replyTo) {
        rememberLocalReply(conversationId, trimmed, options.replyTo);
      }

      emitInboxBump({
        conversationId,
        content: trimmed,
        timestamp,
        fromSelf: true,
      });

      const queue = outboxRef.current[conversationId] ?? [];
      queue.push({
        tempId,
        tempMessageId,
        eventId,
        conversationId,
        content: trimmed,
        attempts: 0,
        replyToMessageId: options?.replyTo?.id,
        replyTo: options?.replyTo,
      });
      outboxRef.current[conversationId] = queue;
      void processOutboxForConversation(conversationId);
    },
    [processOutboxForConversation, user?.email, user?.first_name, user?.last_name, user?.profile_pic]
  );

  const getOrCreateConversation = useCallback(
    async (
      eventId: number,
      otherUserId: string
    ): Promise<{ conversationId: number; detail: ConversationDetail }> => {
      setError(null);
      const result = await getOrCreateConversationApi(eventId, otherUserId);
      return result;
    },
    []
  );

  const bindConversationRealtime = useCallback(
    async (eventId: number, conversationId: number) => {
      const listenerKey = `thread-${conversationId}`;

      try {
        await subscribeToConversationChannel(
          conversationId,
          (event) => {
            if (!event || !isChatNewMessageEvent(event.eventName)) return;
            const message = parseNewMessageFromPusher(event.data);
            if (!message) return;

            upsertIncomingMessage(conversationId, message);
            scheduleAndroidThreadRefetch(eventId, conversationId);

            const myEmail = user?.email?.trim();
            const senderEmail = message.sender_email?.trim();
            if (
              myEmail &&
              senderEmail &&
              senderEmail.toLowerCase() !== myEmail.toLowerCase()
            ) {
              void markConversationRead(eventId, conversationId).then(() => {
                emitInboxRead({ conversationId });
              });
            }
          },
          undefined,
          listenerKey,
        );
        activeRealtimeConversationIdsRef.current.add(conversationId);
      } catch (err: any) {
        if (__DEV__) {
          console.error("[chat] Failed to bind realtime conversation", {
            conversationId,
            message: err?.message,
          });
        }
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
          tags: { area: "chat_realtime", action: "bind" },
          extra: { conversationId, message: err?.message },
        });
      }
    },
    [scheduleAndroidThreadRefetch, upsertIncomingMessage, user?.email],
  );

  const unbindConversationRealtime = useCallback(async (conversationId: number) => {
    const pending = androidThreadRefetchTimersRef.current.get(conversationId);
    if (pending) {
      clearTimeout(pending);
      androidThreadRefetchTimersRef.current.delete(conversationId);
    }

    if (!activeRealtimeConversationIdsRef.current.has(conversationId)) return;
    try {
      await unsubscribeFromConversationChannel(
        conversationId,
        `thread-${conversationId}`
      );
      activeRealtimeConversationIdsRef.current.delete(conversationId);
    } catch (err: any) {
      if (__DEV__) {
        console.error("[chat] Failed to unbind realtime conversation", {
          conversationId,
          message: err?.message,
        });
      }
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        tags: { area: "chat_realtime", action: "unbind" },
        extra: { conversationId, message: err?.message },
      });
    }
  }, []);

  const value: ChatContextType = {
    messagesByConversationId,
    loading,
    error,
    clearError,
    loadConversation,
    refreshConversation: refreshConversationMessages,
    sendMessage,
    getOrCreateConversation,
    bindConversationRealtime,
    unbindConversationRealtime,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (ctx === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
