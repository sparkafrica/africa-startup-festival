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
import * as Sentry from "@sentry/react-native";
import { useAuth } from "./AuthContext";
import {
  getRecentMessages,
  sendMessage as sendChatMessage,
  getOrCreateConversation as getOrCreateConversationApi,
  type ChatMessage,
  type ConversationDetail,
} from "../services/chatService";
import { ApiClientError } from "../services/api";
import {
  subscribeToConversationChannel,
  unsubscribeFromConversationChannel,
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
  /** Send a text message and append to state on success */
  sendMessage: (
    eventId: number,
    conversationId: number,
    content: string
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
  const outboxRef = useRef<Record<number, OutboxItem[]>>({});
  const processingConversationIdsRef = useRef<Set<number>>(new Set());

  const clearError = useCallback(() => setError(null), []);

  const upsertIncomingMessage = useCallback(
    (conversationId: number, incoming: LocalChatMessage) => {
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const idx = current.findIndex((m) => m.id === incoming.id);
        if (idx >= 0) {
          const copy = [...current];
          copy[idx] = { ...copy[idx], ...incoming };
          return { ...prev, [conversationId]: copy };
        }
        return { ...prev, [conversationId]: [...current, incoming] };
      });
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
      setMessagesByConversationId((prev) => {
        const current = prev[conversationId] ?? [];
        const localPendingOrFailed = current.filter(
          (m) => m.client_status === "pending" || m.client_status === "failed"
        );
        return {
          ...prev,
          [conversationId]: [...serverMessages, ...localPendingOrFailed],
        };
      });
    },
    []
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
            await sendChatMessage(item.eventId, item.conversationId, item.content);
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
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: [
            ...messages,
            ...(prev[conversationId] ?? []).filter(
              (m) => m.client_status === "pending" || m.client_status === "failed"
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

  const sendMessage = useCallback(
    async (
      eventId: number,
      conversationId: number,
      content: string
    ) => {
      setError(null);
      const trimmed = content.trim();
      if (!trimmed) return;

      const now = Date.now();
      const tempMessageId = -now;
      const tempId = `temp_${conversationId}_${now}`;
      const optimisticMessage: LocalChatMessage = {
        id: tempMessageId,
        content: trimmed,
        timestamp: new Date(now).toISOString(),
        is_read: false,
        sender_name:
          [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
          user?.email ||
          "You",
        sender_email: user?.email || "",
        sender_profile_pic: user?.profile_pic || "",
        file_attachments: [],
        file_type: undefined,
        client_status: "pending",
        client_temp_id: tempId,
      };

      setMessagesByConversationId((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage],
      }));

      const queue = outboxRef.current[conversationId] ?? [];
      queue.push({
        tempId,
        tempMessageId,
        eventId,
        conversationId,
        content: trimmed,
        attempts: 0,
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
    async (_eventId: number, conversationId: number) => {
      if (activeRealtimeConversationIdsRef.current.has(conversationId)) return;

      try {
        await subscribeToConversationChannel(
          conversationId,
          (event) => {
          if (!event || event.eventName !== "new-message") return;
          const raw = event.data as any;
          let parsed: any = raw;
          if (typeof raw === "string") {
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = raw;
            }
          }
          if (!parsed || typeof parsed !== "object") return;

          const msgId = Number(parsed.id);
          const content = typeof parsed.content === "string" ? parsed.content : "";
          const timestamp =
            typeof parsed.timestamp === "string"
              ? parsed.timestamp
              : new Date().toISOString();

          if (!Number.isFinite(msgId) || !content) return;

          const message: ChatMessage = {
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
          };

          upsertIncomingMessage(conversationId, message);
        },
          undefined,
          `thread-${conversationId}`
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
    [upsertIncomingMessage]
  );

  const unbindConversationRealtime = useCallback(async (conversationId: number) => {
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
