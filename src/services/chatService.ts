/**
 * Chat Service
 *
 * REST and Pusher integration for 1:1 in-app messaging.
 * All paths and schemas follow Spark EMS.yaml (backend is source of truth).
 *
 * Endpoints used:
 * - GET  /events/{event_id}/conversations/           → list conversations
 * - GET  /events/{event_id}/conversations/{id}/       → conversation detail + messages
 * - POST /events/{event_id}/conversations/initiate/   → create 1:1 (body: { user_id })
 * - GET  /events/{event_id}/conversations/{id}/messages/ or .../recent_messages/ → messages
 * - POST /events/{event_id}/conversations/{id}/send_message/ → send (body: { content })
 * - POST /events/{event_id}/conversations/{id}/mark_read/    → mark read
 * - POST /pusher/auth/  (form: socket_id, channel_name)     → auth for private channels
 *
 * Note: Initiate response is { user_id }. To get conversation id we list conversations
 * after initiate and use the newest (or backend may add conversation_id to response later).
 */

import { api } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// TYPES (aligned with Spark EMS.yaml)
// ============================================================================

/** Message – backend schema Message */
export interface ChatMessage {
  id: number;
  content: string;
  timestamp: string; // date-time
  is_read: boolean;
  sender_name: string;
  sender_email: string;
  sender_profile_pic: string;
  file_attachments?: unknown[];
  file_type?: string;
}

/** Conversation list item – backend ConversationList (runtime may send richer shapes). */
export interface ConversationListItem {
  id: number;
  /** Display name when API sends it explicitly. */
  other_party_name?: string;
  /** String (legacy) or nested user-like object from API. */
  other_party?: string | Record<string, unknown>;
  /** Plain string preview or object with content / timestamp (e.g. last activity). */
  last_message?: string | Record<string, unknown>;
  updated_at: string;
  unread_count: string;
  event_name: string;
}

/** Conversation detail – backend ConversationDetail */
export interface ConversationDetail {
  id: number;
  messages: ChatMessage[];
  other_party: string;
  event_name: string;
}

/** Initiate request – backend InitiateConversationRequest */
export interface InitiateConversationRequest {
  user_id: string;
}

/** Initiate response – backend InitiateConversation (only user_id in YAML) */
export interface InitiateConversationResponse {
  user_id: string;
}

/** Send message request – backend SendMessageRequest */
export interface SendMessageRequest {
  content: string;
  file_attachments?: unknown[];
}

/** Send message response – backend SendMessage */
export interface SendMessageResponse {
  content: string;
  file_attachments?: string[];
}

/** Pusher auth request – form body for POST /pusher/auth/ */
export interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

/** Pusher auth response – backend 200 body (ideal shape) */
export interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
}

/**
 * Pusher RN forwards this object to native code, which only allows keys:
 * auth, channel_data, shared_secret. Any other key (e.g. socket_id echo or a
 * body shaped as { [socketId]: "key:sig" }) triggers "Invalid key in subscription auth data".
 */
export type PusherNativeAuthorizerPayload = {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
};

function looksLikePusherAuthSignature(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.includes(":") && !t.startsWith("{");
}

/**
 * Coerce various backend shapes into the minimal payload native Pusher accepts.
 */
export function normalizePusherAuthorizerPayload(
  inner: unknown,
  socketId: string
): PusherNativeAuthorizerPayload {
  let parsed: unknown = inner;
  if (typeof inner === "string") {
    try {
      parsed = JSON.parse(inner) as unknown;
    } catch {
      throw new ApiClientError({
        status: "error",
        message: "Invalid pusher auth response (not JSON)",
        response_code: 502,
        data: {},
      });
    }
  }

  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ApiClientError({
      status: "error",
      message: "Invalid pusher auth response shape",
      response_code: 502,
      data: {},
    });
  }

  const o = parsed as Record<string, unknown>;
  let authStr: string | null = null;

  const direct = o.auth;
  if (typeof direct === "string" && looksLikePusherAuthSignature(direct)) {
    authStr = direct.trim();
  } else if (typeof direct === "string" && direct.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(direct) as Record<string, unknown>;
      const innerAuth = parsed.auth;
      if (typeof innerAuth === "string" && looksLikePusherAuthSignature(innerAuth)) {
        authStr = innerAuth.trim();
      }
    } catch {
      /* ignore */
    }
  } else if (direct != null && typeof direct === "object" && !Array.isArray(direct)) {
    const nested = direct as Record<string, unknown>;
    const fromSocket = nested[socketId];
    if (typeof fromSocket === "string" && looksLikePusherAuthSignature(fromSocket)) {
      authStr = fromSocket.trim();
    } else {
      for (const v of Object.values(nested)) {
        if (typeof v === "string" && looksLikePusherAuthSignature(v)) {
          authStr = v.trim();
          break;
        }
      }
    }
  }

  if (
    !authStr &&
    typeof o[socketId] === "string" &&
    looksLikePusherAuthSignature(o[socketId] as string)
  ) {
    authStr = (o[socketId] as string).trim();
  }

  if (!authStr) {
    const keys = Object.keys(o).filter(
      (k) => k !== "channel_data" && k !== "shared_secret"
    );
    if (keys.length === 1 && typeof o[keys[0]] === "string") {
      const v = o[keys[0]] as string;
      if (looksLikePusherAuthSignature(v)) authStr = v.trim();
    }
  }

  if (!authStr) {
    throw new ApiClientError({
      status: "error",
      message: "Pusher auth response missing usable auth signature",
      response_code: 502,
      data: {},
    });
  }

  const payload: PusherNativeAuthorizerPayload = { auth: authStr };
  if (typeof o.channel_data === "string") payload.channel_data = o.channel_data;
  if (typeof o.shared_secret === "string") payload.shared_secret = o.shared_secret;

  return payload;
}

export interface PaginationMeta {
  count: number;
  next: string | null;
  previous: string | null;
}

// ============================================================================
// HELPERS – normalize backend response (same pattern as eventService)
// ============================================================================

function unwrapData<T>(data: any): T {
  if (data?.status === "success" && data?.data !== undefined) {
    return data.data as T;
  }
  return data as T;
}

function unwrapPaginated<T>(data: any): { results: T[]; pagination: PaginationMeta } {
  const raw = unwrapData<any>(data);
  if (raw?.results && Array.isArray(raw.results)) {
    return {
      results: raw.results as T[],
      pagination: {
        count: raw.count ?? 0,
        next: raw.next ?? null,
        previous: raw.previous ?? null,
      },
    };
  }
  if (Array.isArray(raw)) {
    return {
      results: raw as T[],
      pagination: { count: raw.length, next: null, previous: null },
    };
  }
  return { results: [], pagination: { count: 0, next: null, previous: null } };
}

/** Backend may send unread as string, int, or camelCase; keep list + badge math consistent. */
function normalizeConversationListItem(raw: Record<string, unknown>): ConversationListItem {
  const u =
    raw.unread_count ??
    (raw as { unreadCount?: unknown }).unreadCount ??
    raw.unread_messages_count;
  let unread_count = "0";
  if (typeof u === "number" && Number.isFinite(u)) {
    unread_count = String(Math.max(0, Math.floor(u)));
  } else if (typeof u === "string") {
    unread_count = u.trim() || "0";
  }
  return {
    ...(raw as unknown as ConversationListItem),
    unread_count,
  };
}

// ============================================================================
// API METHODS
// ============================================================================

/**
 * List conversations for the authenticated user in an event.
 * GET /events/{event_id}/conversations/
 */
export async function listConversations(
  eventId: number,
  params?: { ordering?: string; page?: number; page_size?: number; search?: string }
): Promise<{ conversations: ConversationListItem[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params?.ordering) query.set("ordering", params.ordering);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.page_size != null) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const path = `/events/${eventId}/conversations/`;
  const fullUrl = qs ? `${path}?${qs}` : path;
  const response = await api.get<any>(fullUrl);
  const { results, pagination } = unwrapPaginated<Record<string, unknown>>(response);
  return {
    conversations: results.map((r) => normalizeConversationListItem(r)),
    pagination,
  };
}

/**
 * Get one conversation with messages.
 * GET /events/{event_id}/conversations/{id}/
 */
export async function getConversation(
  eventId: number,
  conversationId: number
): Promise<ConversationDetail> {
  const response = await api.get<any>(`/events/${eventId}/conversations/${conversationId}/`);
  return unwrapData<ConversationDetail>(response);
}

/**
 * Start a 1:1 conversation. Backend creates the conversation.
 * POST /events/{event_id}/conversations/initiate/
 * Response: { user_id }. Backend does not return conversation_id; use getOrCreateConversation to obtain it.
 */
export async function initiateConversation(
  eventId: number,
  userId: string
): Promise<InitiateConversationResponse> {
  const response = await api.post<any>(`/events/${eventId}/conversations/initiate/`, {
    user_id: userId,
  } as InitiateConversationRequest);
  return unwrapData<InitiateConversationResponse>(response);
}

/**
 * Get or create a conversation with another user. Calls initiate, then lists conversations
 * and returns the newest (assumes the one just created is first when ordered by -updated_at).
 * Use this when opening chat from a connection card.
 */
export async function getOrCreateConversation(
  eventId: number,
  otherUserId: string
): Promise<{ conversationId: number; detail: ConversationDetail }> {
  await initiateConversation(eventId, otherUserId);
  const { conversations } = await listConversations(eventId, {
    ordering: "-updated_at",
    page_size: 20,
  });
  if (conversations.length === 0) {
    throw new ApiClientError({
      status: "error",
      message: "Conversation was created but could not be loaded. Please try again.",
      response_code: 0,
      data: {},
    });
  }
  const first = conversations[0];
  const detail = await getConversation(eventId, first.id);
  return { conversationId: first.id, detail };
}

/**
 * Get messages in a conversation.
 * GET /events/{event_id}/conversations/{id}/messages/
 */
export async function getMessages(
  eventId: number,
  conversationId: number
): Promise<ChatMessage[]> {
  const response = await api.get<any>(
    `/events/${eventId}/conversations/${conversationId}/messages/`
  );
  const data = unwrapData<any>(response);
  if (Array.isArray(data)) return data as ChatMessage[];
  if (data?.results && Array.isArray(data.results)) return data.results as ChatMessage[];
  return [];
}

/**
 * Get recent messages (last 20).
 * GET /events/{event_id}/conversations/{id}/recent_messages/
 */
export async function getRecentMessages(
  eventId: number,
  conversationId: number
): Promise<ChatMessage[]> {
  const response = await api.get<any>(
    `/events/${eventId}/conversations/${conversationId}/recent_messages/`
  );
  const data = unwrapData<any>(response);
  if (Array.isArray(data)) return data as ChatMessage[];
  if (data?.results && Array.isArray(data.results)) return data.results as ChatMessage[];
  return [];
}

/**
 * Send a text message.
 * POST /events/{event_id}/conversations/{id}/send_message/
 */
export async function sendMessage(
  eventId: number,
  conversationId: number,
  content: string
): Promise<SendMessageResponse> {
  const response = await api.post<any>(
    `/events/${eventId}/conversations/${conversationId}/send_message/`,
    { content } as SendMessageRequest
  );
  return unwrapData<SendMessageResponse>(response);
}

/**
 * Mark all messages in a conversation as read.
 * POST /events/{event_id}/conversations/{id}/mark_read/
 */
export async function markConversationRead(
  eventId: number,
  conversationId: number
): Promise<void> {
  await api.post(`/events/${eventId}/conversations/${conversationId}/mark_read/`, {});
}

/**
 * Authenticate subscription to a private Pusher channel.
 * POST /pusher/auth/ with application/x-www-form-urlencoded body: socket_id, channel_name.
 * Returns a native-safe payload (only auth / channel_data / shared_secret).
 */
export async function pusherAuth(
  socketId: string,
  channelName: string
): Promise<PusherNativeAuthorizerPayload> {
  const body = new URLSearchParams();
  body.set("socket_id", socketId);
  body.set("channel_name", channelName);
  const response = await api.post<any>("/pusher/auth/", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const inner = unwrapData<any>(response);
  return normalizePusherAuthorizerPayload(inner, socketId);
}
