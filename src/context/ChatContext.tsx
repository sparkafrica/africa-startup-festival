/**
 * ChatContext – central state for 1:1 in-app messaging.
 * Holds messages per conversation and exposes load/send/getOrCreate.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  getRecentMessages,
  sendMessage as sendChatMessage,
  getOrCreateConversation as getOrCreateConversationApi,
  type ChatMessage,
  type ConversationDetail,
} from "../services/chatService";
import { ApiClientError } from "../services/api";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ChatContextType {
  /** Messages keyed by conversation id (backend conversation id) */
  messagesByConversationId: Record<number, ChatMessage[]>;
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messagesByConversationId, setMessagesByConversationId] = useState<
    Record<number, ChatMessage[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadConversation = useCallback(
    async (eventId: number, conversationId: number) => {
      setLoading(true);
      setError(null);
      try {
        const messages = await getRecentMessages(eventId, conversationId);
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: messages,
        }));
      } catch (err: any) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load messages.";
        setError(msg);
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
      try {
        await sendChatMessage(eventId, conversationId, content);
        const messages = await getRecentMessages(eventId, conversationId);
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: messages,
        }));
      } catch (err: any) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Failed to send message.";
        setError(msg);
        throw err;
      }
    },
    []
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

  const value: ChatContextType = {
    messagesByConversationId,
    loading,
    error,
    clearError,
    loadConversation,
    sendMessage,
    getOrCreateConversation,
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
