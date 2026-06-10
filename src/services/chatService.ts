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
 * Backend contract (stable ids):
 * - GET  .../conversations/ — list rows should include other_party_user_id (Spark user id
 *   string) for matching; other_party may remain a display string.
 * - POST .../conversations/initiate/ — response should include conversation_id with user_id
 *   so the client can open the thread without a second list guess.
 */

import { api } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// TYPES (aligned with Spark EMS.yaml)
// ============================================================================

/** Quoted message when replying (client + optional backend field). */
export interface MessageReplyTo {
  id: number;
  content: string;
  sender_name: string;
}

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
  /** Present when message is a reply; backend may add `reply_to` or `reply_to_message_id`. */
  reply_to?: MessageReplyTo;
  reply_to_message_id?: number;
}

/** Conversation list item – backend ConversationList (runtime may send richer shapes). */
export interface ConversationListItem {
  id: number;
  /**
   * Stable Spark user id for the other participant (preferred for list matching).
   * Backend adds this alongside display `other_party` string.
   */
  other_party_user_id?: string;
  /** Display name when API sends it explicitly. */
  other_party_name?: string;
  /** Display string (YAML) or nested user-like object from API. */
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

/**
 * POST .../conversations/initiate/ body (idempotent).
 * Backend should return conversation_id with user_id so the client opens the correct thread.
 */
export interface InitiateConversationResponse {
  user_id: string;
  conversation_id?: number;
}

/** Send message request – backend SendMessageRequest */
export interface SendMessageRequest {
  content: string;
  file_attachments?: unknown[];
  /** Optional — ask backend to accept when enabling swipe-to-reply. */
  reply_to_message_id?: number;
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

function stringOrNumberId(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/**
 * Peer Spark user id for list matching. Prefers `other_party_user_id` from GET .../conversations/.
 * Falls back to legacy/extra keys and nested `other_party` objects.
 */
export function getConversationListItemPeerUserId(
  item: ConversationListItem
): string | null {
  const r = item as unknown as Record<string, unknown>;
  // Canonical + aliases (snake_case / camelCase serializers)
  for (const key of [
    "other_party_user_id",
    "otherPartyUserId",
    "other_user_id",
    "otherUserId",
    "peer_user_id",
    "peerUserId",
    "other_party_id",
    "otherPartyId",
  ]) {
    const got = stringOrNumberId(r[key]);
    if (got) return got;
  }
  const raw = item.other_party;
  if (typeof raw === "string") {
    const t = raw.trim();
    // Only treat as id when it plausibly matches a user id (not a display name sentence).
    if (
      t.length > 0 &&
      (t.includes("userid_") || t.includes("_") || /^[a-zA-Z0-9]{12,}$/.test(t))
    ) {
      return t;
    }
    return null;
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [obj.user_id, obj.id, obj.uuid];
    for (const c of candidates) {
      const got = stringOrNumberId(c);
      if (got) return got;
    }
  }
  return null;
}

function normalizePeerUserId(userId: string): string {
  return userId.trim();
}

function findConversationListItemForPeer(
  items: ConversationListItem[],
  peerUserId: string
): ConversationListItem | null {
  const want = normalizePeerUserId(peerUserId);
  if (!want) return null;
  for (const item of items) {
    const got = getConversationListItemPeerUserId(item);
    if (got && got === want) return item;
  }
  return null;
}

/** When initiate adds exactly one new row, its id was not in the prior list. */
function soleConversationNotInPrior(
  priorIds: Set<number>,
  items: ConversationListItem[]
): ConversationListItem | null {
  const novel = items.filter((c) => !priorIds.has(c.id));
  return novel.length === 1 ? novel[0] : null;
}

/** POST initiate: conversation_id (snake_case or camelCase), int or numeric string. */
function coerceInitiateConversationId(
  payload: InitiateConversationResponse | Record<string, unknown>
): number | null {
  const o = payload as Record<string, unknown>;
  const raw =
    (payload as InitiateConversationResponse).conversation_id ??
    o.conversation_id ??
    o.conversationId;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  if (typeof raw === "string") {
    const n = parseInt(raw.trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
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
 * Start a 1:1 conversation (idempotent). POST /events/{event_id}/conversations/initiate/
 * Response: { user_id }; optional conversation_id when backend returns it.
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
 * Open a 1:1 thread with another user. Lists first and matches by peer id when possible;
 * otherwise initiate (idempotent). If initiate returns conversation_id, uses it directly.
 * Otherwise re-lists and matches / single-new-row fallback (never conversations[0] alone).
 */
export async function getOrCreateConversation(
  eventId: number,
  otherUserId: string
): Promise<{ conversationId: number; detail: ConversationDetail }> {
  const peer = normalizePeerUserId(otherUserId);
  if (!peer) {
    throw new ApiClientError({
      status: "error",
      message: "Invalid user to start a chat with.",
      response_code: 0,
      data: {},
    });
  }

  const listParams = {
    ordering: "-updated_at" as const,
    page_size: 100,
  };

  let { conversations } = await listConversations(eventId, listParams);
  let match = findConversationListItemForPeer(conversations, peer);

  if (match) {
    const detail = await getConversation(eventId, match.id);
    return { conversationId: match.id, detail };
  }

  const priorIds = new Set(conversations.map((c) => c.id));
  const initiated = await initiateConversation(eventId, peer);
  const idFromInitiate = coerceInitiateConversationId(initiated);
  if (idFromInitiate != null) {
    const detail = await getConversation(eventId, idFromInitiate);
    return { conversationId: idFromInitiate, detail };
  }

  ({ conversations } = await listConversations(eventId, listParams));
  match =
    findConversationListItemForPeer(conversations, peer) ??
    soleConversationNotInPrior(priorIds, conversations);

  if (!match) {
    throw new ApiClientError({
      status: "error",
      message:
        "Could not open this chat. Try again, or open the thread from Messages.",
      response_code: 0,
      data: {},
    });
  }

  const detail = await getConversation(eventId, match.id);
  return { conversationId: match.id, detail };
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
  content: string,
  options?: { replyToMessageId?: number },
): Promise<SendMessageResponse> {
  const body: SendMessageRequest = { content };
  if (
    options?.replyToMessageId != null &&
    Number.isFinite(options.replyToMessageId) &&
    options.replyToMessageId > 0
  ) {
    body.reply_to_message_id = options.replyToMessageId;
  }
  const response = await api.post<any>(
    `/events/${eventId}/conversations/${conversationId}/send_message/`,
    body,
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
