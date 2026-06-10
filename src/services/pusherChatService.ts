import {
  Pusher,
  type PusherAuthorizerResult,
  type PusherChannel,
  type PusherEvent,
} from "@pusher/pusher-websocket-react-native";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import { PUSHER_API_KEY, PUSHER_CLUSTER } from "../config/env";
import { pusherAuth } from "./chatService";

const pusher = Pusher.getInstance();

let isInitialized = false;
let connectPromise: Promise<void> | null = null;
const subscribedChannelNames = new Set<string>();
/** Multiple RN listeners per conversation channel (inbox + thread) — Pusher RN only stores one `onEvent` on the channel object. */
const conversationListeners = new Map<
  string,
  Map<string, (event: PusherEvent) => void>
>();

type ConnectionStateListener = (
  currentState: string,
  previousState: string,
) => void;
const connectionStateListeners = new Set<ConnectionStateListener>();

function invokeConversationListener(
  fn: (event: PusherEvent) => void,
  event: PusherEvent,
  channelName: string,
) {
  const run = () => {
    try {
      fn(event);
    } catch (err) {
      captureRealtimeError(
        "subscribe",
        err instanceof Error ? err : new Error(String(err)),
        { channelName, listenerError: true },
      );
    }
  };
  // Native Pusher callbacks on Android can land off the RN render path.
  if (Platform.OS === "android") {
    queueMicrotask(run);
  } else {
    run();
  }
}

function dispatchConversationChannelEvent(
  channelName: string,
  event: PusherEvent,
) {
  const listeners = conversationListeners.get(channelName);
  if (!listeners || listeners.size === 0) return;
  listeners.forEach((fn) => {
    invokeConversationListener(fn, event, channelName);
  });
}

function isConversationChannelEvent(event: PusherEvent): boolean {
  return (
    typeof event.channelName === "string" &&
    event.channelName.startsWith("private-conversation-")
  );
}

function captureRealtimeError(
  stage: "init" | "connect" | "disconnect" | "subscribe" | "unsubscribe",
  error: unknown,
  extras?: Record<string, unknown>,
) {
  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    {
      tags: { area: "chat_realtime", stage },
      extra: extras,
    },
  );
}

export function getConversationChannelName(conversationId: number): string {
  return `private-conversation-${conversationId}`;
}

export function isChatNewMessageEvent(eventName: string | undefined): boolean {
  const normalized = (eventName ?? "").trim().toLowerCase();
  return normalized === "new-message" || normalized === "new_message";
}

export function getUserChannelName(userId: string): string {
  return `private-user-${userId}`;
}

export async function initPusherChat(): Promise<void> {
  if (isInitialized) return;

  try {
    await pusher.init({
      apiKey: PUSHER_API_KEY,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
      /** Route all conversation events here — Pusher RN reuses channel objects and can drop per-channel onEvent updates (especially on Android). */
      onEvent: (event: PusherEvent) => {
        if (!isConversationChannelEvent(event)) return;
        dispatchConversationChannelEvent(event.channelName, event);
      },
      onAuthorizer: async (channelName: string, socketId: string) => {
        const payload = await pusherAuth(socketId, channelName);
        const out: PusherAuthorizerResult = { auth: payload.auth };
        if (payload.channel_data != null) out.channel_data = payload.channel_data;
        if (payload.shared_secret != null) out.shared_secret = payload.shared_secret;
        return out;
      },
      onError: (message, code, e) => {
        captureRealtimeError("init", new Error(message), {
          code,
          error: e,
        });
      },
      onConnectionStateChange: (currentState, previousState) => {
        connectionStateListeners.forEach((listener) => {
          try {
            listener(currentState, previousState);
          } catch {
            /* ignore */
          }
        });
      },
    });

    isInitialized = true;
  } catch (err: any) {
    captureRealtimeError("init", err, {
      message: err?.message,
    });
    throw err;
  }
}

export async function connectPusherChat(): Promise<void> {
  await initPusherChat();

  if (pusher.connectionState === "CONNECTED") return;

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        await pusher.connect();
      } catch (err: any) {
        captureRealtimeError("connect", err, {
          message: err?.message,
          connectionState: pusher.connectionState,
        });
        throw err;
      } finally {
        connectPromise = null;
      }
    })();
  }

  await connectPromise;
}

export async function disconnectPusherChat(): Promise<void> {
  if (!isInitialized) return;
  try {
    subscribedChannelNames.clear();
    conversationListeners.clear();
    await pusher.disconnect();
  } catch (err: any) {
    captureRealtimeError("disconnect", err, {
      message: err?.message,
    });
    throw err;
  }
}

function isExistingSubscriptionError(err: unknown): boolean {
  const msg = String(
    err instanceof Error
      ? err.message
      : ((err as { message?: string })?.message ?? err ?? ""),
  );
  return /existing subscription/i.test(msg);
}

export async function subscribeToConversationChannel(
  conversationId: number,
  onEvent: (event: PusherEvent) => void,
  opts?: {
    onSubscriptionSucceeded?: (data: any) => void;
    onSubscriptionError?: (
      channelName: string,
      message: string,
      e: any,
    ) => void;
  },
  listenerKey: string = "thread",
): Promise<PusherChannel> {
  await connectPusherChat();

  const channelName = getConversationChannelName(conversationId);
  let bucket = conversationListeners.get(channelName);
  if (!bucket) {
    bucket = new Map();
    conversationListeners.set(channelName, bucket);
  }
  bucket.set(listenerKey, onEvent);

  const existing = pusher.getChannel(channelName);
  if (existing) {
    subscribedChannelNames.add(channelName);
    return existing;
  }

  const subscribeOnce = () =>
    pusher.subscribe({
      channelName,
      onSubscriptionSucceeded: (data) => {
        subscribedChannelNames.add(channelName);
        opts?.onSubscriptionSucceeded?.(data);
      },
      onSubscriptionError: (failedChannelName, message, e) => {
        captureRealtimeError("subscribe", new Error(message), {
          channelName: failedChannelName,
          error: e,
        });
        opts?.onSubscriptionError?.(failedChannelName, message, e);
      },
    });

  const rollbackListener = () => {
    bucket.delete(listenerKey);
    if (bucket.size === 0) {
      conversationListeners.delete(channelName);
    }
  };

  try {
    return await subscribeOnce();
  } catch (err: any) {
    if (!isExistingSubscriptionError(err)) {
      rollbackListener();
      captureRealtimeError("subscribe", err, {
        channelName,
        conversationId,
        message: err?.message,
      });
      throw err;
    }
    try {
      await pusher.unsubscribe({ channelName });
    } catch {
      /* native may already be in an odd state */
    }
    subscribedChannelNames.delete(channelName);
    try {
      return await subscribeOnce();
    } catch (retryErr: any) {
      rollbackListener();
      captureRealtimeError("subscribe", retryErr, {
        channelName,
        conversationId,
        message: retryErr?.message,
        afterResync: true,
      });
      throw retryErr;
    }
  }
}

export async function unsubscribeFromConversationChannel(
  conversationId: number,
  listenerKey?: string,
): Promise<void> {
  if (!isInitialized) return;
  const channelName = getConversationChannelName(conversationId);
  const bucket = conversationListeners.get(channelName);
  if (bucket) {
    if (listenerKey === undefined) {
      bucket.clear();
    } else {
      bucket.delete(listenerKey);
    }
    if (bucket.size === 0) {
      conversationListeners.delete(channelName);
    }
  }

  const stillHasListeners =
    (conversationListeners.get(channelName)?.size ?? 0) > 0;
  if (stillHasListeners) {
    return;
  }

  if (
    !subscribedChannelNames.has(channelName) &&
    !pusher.getChannel(channelName)
  ) {
    return;
  }
  try {
    await pusher.unsubscribe({ channelName });
    subscribedChannelNames.delete(channelName);
  } catch (err: any) {
    captureRealtimeError("unsubscribe", err, {
      channelName,
      conversationId,
      message: err?.message,
    });
    throw err;
  }
}

export async function subscribeToUserChannel(
  userId: string,
  onEvent: (event: PusherEvent) => void,
  opts?: {
    onSubscriptionSucceeded?: (data: any) => void;
    onSubscriptionError?: (
      channelName: string,
      message: string,
      e: any,
    ) => void;
  },
): Promise<PusherChannel> {
  await connectPusherChat();

  const channelName = getUserChannelName(userId);
  const existing = pusher.getChannel(channelName);
  if (existing) {
    subscribedChannelNames.add(channelName);
    return existing;
  }

  const subscribeUserOnce = () =>
    pusher.subscribe({
      channelName,
      onSubscriptionSucceeded: (data) => {
        subscribedChannelNames.add(channelName);
        opts?.onSubscriptionSucceeded?.(data);
      },
      onSubscriptionError: (failedChannelName, message, e) => {
        captureRealtimeError("subscribe", new Error(message), {
          channelName: failedChannelName,
          error: e,
        });
        opts?.onSubscriptionError?.(failedChannelName, message, e);
      },
      onEvent,
    });

  try {
    return await subscribeUserOnce();
  } catch (err: any) {
    if (!isExistingSubscriptionError(err)) {
      captureRealtimeError("subscribe", err, {
        channelName,
        userId,
        message: err?.message,
      });
      throw err;
    }
    try {
      await pusher.unsubscribe({ channelName });
    } catch {
      /* ignore */
    }
    subscribedChannelNames.delete(channelName);
    try {
      return await subscribeUserOnce();
    } catch (retryErr: any) {
      captureRealtimeError("subscribe", retryErr, {
        channelName,
        userId,
        message: retryErr?.message,
        afterResync: true,
      });
      throw retryErr;
    }
  }
}

export async function unsubscribeFromUserChannel(
  userId: string,
): Promise<void> {
  if (!isInitialized) return;
  const channelName = getUserChannelName(userId);
  if (
    !subscribedChannelNames.has(channelName) &&
    !pusher.getChannel(channelName)
  ) {
    return;
  }
  try {
    await pusher.unsubscribe({ channelName });
    subscribedChannelNames.delete(channelName);
  } catch (err: any) {
    captureRealtimeError("unsubscribe", err, {
      channelName,
      userId,
      message: err?.message,
    });
    throw err;
  }
}

export function addPusherConnectionStateListener(
  listener: ConnectionStateListener,
): () => void {
  connectionStateListeners.add(listener);
  return () => {
    connectionStateListeners.delete(listener);
  };
}
