import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { SkeletonMessageList } from "../components";
import {
  getConversationListItemPeerUserId,
  listConversations,
  markConversationRead,
  type ConversationListItem,
} from "../services/chatService";
import { connectionService, type Connection } from "../services/connectionService";
import { ApiClientError } from "../services/api";
import { EVENT_ID } from "../config/env";
import { useAuth } from "../context/AuthContext";
import { useMessagesBadgeContext } from "../context/MessagesBadgeContext";
import * as Sentry from "@sentry/react-native";
import {
  subscribeToConversationChannel,
  unsubscribeFromConversationChannel,
  isChatNewMessageEvent,
} from "../services/pusherChatService";
import {
  bumpConversationInList,
  getConversationRowTimestamp,
  sortConversationsByRecent,
} from "../utils/conversationListUtils";
import {
  subscribeInboxBump,
  subscribeInboxRead,
} from "../utils/chatInboxSync";

/** Cap how many threads we subscribe on the inbox (each = one private channel). */
const MAX_INBOX_CONVERSATION_SUBS = 50;

/** WhatsApp-style: time today, then Yesterday, weekday this week, then date (same year / full). */
function formatConversationTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (Number.isNaN(d.getTime())) return "";

    const startOf = (x: Date) =>
      new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round(
      (startOf(now) - startOf(d)) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays > 1 && diffDays < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getUnreadCount(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** Prefer API `other_party_name`, then string `other_party`, then nested user fields. */
function getConversationDisplayName(item: ConversationListItem): string {
  const explicit = item.other_party_name;
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }
  const raw = item.other_party;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t.length > 0) return t;
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const fn = typeof o.first_name === "string" ? o.first_name.trim() : "";
    const ln = typeof o.last_name === "string" ? o.last_name.trim() : "";
    const combined = `${fn} ${ln}`.trim();
    if (combined) return combined;
    if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
    if (typeof o.display_name === "string" && o.display_name.trim()) {
      return o.display_name.trim();
    }
    if (typeof o.email === "string" && o.email.trim()) {
      const local = o.email.split("@")[0]?.trim();
      if (local) return local;
    }
  }
  return "Chat";
}

function getConversationAvatarUri(
  item: ConversationListItem
): string | undefined {
  const raw = item.other_party;
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const uri = o.profile_pic;
  if (typeof uri !== "string") return undefined;
  const t = uri.trim();
  return t.length ? t : undefined;
}

/** For a connection row, return the "other user" id relative to current user. */
function getPeerUserId(connection: Connection, currentUserId: string): string | null {
  const fromId = String(connection.from_user?.id ?? "").trim();
  const toId = String(connection.to_user?.id ?? "").trim();
  if (!fromId || !toId) return null;
  if (fromId === currentUserId) return toId;
  if (toId === currentUserId) return fromId;
  return null;
}

function getLastMessagePreview(raw: unknown): string {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : "No messages yet";
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const content =
      typeof obj.content === "string"
        ? obj.content
        : typeof obj.message === "string"
          ? obj.message
          : "";
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : "No messages yet";
  }
  return "No messages yet";
}

export default function MessagesScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Messages">>();
  const route = useRoute<RouteProp<RootStackParamList, "Messages">>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { refresh: refreshMessagesBadge } = useMessagesBadgeContext();
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** After first successful load, refocus + Pusher refetch stay on the list UI (no full-screen spinner). */
  const inboxHasLoadedOnceRef = useRef(false);
  const deepLinkHandledConversationIdRef = useRef<number | null>(null);

  const fetchConversations = useCallback(
    async (
      opts?: { pull?: boolean; silent?: boolean }
    ): Promise<ConversationListItem[]> => {
      const pull = opts?.pull === true;
      const silent = opts?.silent === true;
      try {
        if (silent) {
          /* background: keep list visible */
        } else if (pull) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const [conversationResponse, connectionsResult] = await Promise.all([
          listConversations(EVENT_ID, {
            ordering: "-updated_at",
            page: 1,
            page_size: 100,
          }),
          connectionService
            .getConnections(1, 200)
            .then((r) => ({ ok: true as const, connections: r.connections }))
            .catch(() => ({ ok: false as const, connections: [] as Connection[] })),
        ]);

        const currentUserId = String(user?.user_id ?? "").trim();

        // Only filter inbox by connections when the connections request succeeded.
        // If it failed (network error), an empty list was previously treated as "no
        // connections" and hid every thread — same symptom as "the app is broken".
        let filteredConversations = conversationResponse.conversations;
        if (connectionsResult.ok && currentUserId) {
          const acceptedPeerIds = new Set(
            connectionsResult.connections
              .filter((c) => c.status === "accepted")
              .map((c) => getPeerUserId(c, currentUserId))
              .filter((id): id is string => typeof id === "string" && id.length > 0)
          );
          filteredConversations = conversationResponse.conversations.filter((c) => {
            const otherPartyId = getConversationListItemPeerUserId(c);
            if (!otherPartyId) return true;
            return acceptedPeerIds.has(otherPartyId);
          });
        }

        setConversations(sortConversationsByRecent(filteredConversations));
        inboxHasLoadedOnceRef.current = true;
        void refreshMessagesBadge({ force: true });
        return filteredConversations;
      } catch (err: any) {
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load messages. Please try again.";
        if (!silent) {
          setError(msg);
        }
        return [];
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.user_id, refreshMessagesBadge]
  );

  useFocusEffect(
    useCallback(() => {
      void fetchConversations(
        inboxHasLoadedOnceRef.current ? { silent: true } : undefined
      );
    }, [fetchConversations])
  );

  /** Android: keep inbox rows fresh when Pusher events do not repaint the list. */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return undefined;
      const intervalId = setInterval(() => {
        void fetchConversations({ silent: true });
      }, 3000);
      return () => clearInterval(intervalId);
    }, [fetchConversations]),
  );

  /** Optimistic reorder when a thread gets new activity while inbox is mounted. */
  useEffect(() => {
    const unsubBump = subscribeInboxBump((event) => {
      const ts = event.timestamp ?? new Date().toISOString();
      setConversations((prev) =>
        bumpConversationInList(prev, event.conversationId, {
          updated_at: ts,
          last_message: {
            content: event.content,
            timestamp: ts,
          },
        }),
      );
    });
    const unsubRead = subscribeInboxRead(({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: "0" } : c,
        ),
      );
    });
    return () => {
      unsubBump();
      unsubRead();
    };
  }, []);

  const conversationIds = useMemo(
    () => conversations.map((c) => c.id),
    [conversations]
  );
  const conversationIdsKey = conversationIds.join(",");

  /**
   * Live inbox: backend emits `new-message` on `private-conversation-{id}` (not reliably on user channel).
   * Subscribe to each listed conversation while this screen is focused — merged with thread listener in pusherChatService.
   */
  useEffect(() => {
    const userId = user?.user_id?.trim();
    if (!isFocused || !userId) return undefined;

    const ids = conversationIds.slice(0, MAX_INBOX_CONVERSATION_SUBS);
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!cancelled) void fetchConversations({ silent: true });
      }, 400);
    };

    void (async () => {
      for (const id of ids) {
        try {
          await subscribeToConversationChannel(
            id,
            (event) => {
              if (!isChatNewMessageEvent(event.eventName)) return;
              scheduleRefetch();
            },
            undefined,
            `inbox-${userId}-${id}`
          );
        } catch (err) {
          Sentry.captureException(
            err instanceof Error ? err : new Error(String(err)),
            {
              tags: { area: "chat_realtime", action: "inbox_subscribe" },
              extra: { conversationId: id },
            }
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const id of ids) {
        void unsubscribeFromConversationChannel(id, `inbox-${userId}-${id}`);
      }
    };
  }, [isFocused, conversationIdsKey, fetchConversations, user?.user_id]);

  useEffect(() => {
    const cid = route.params?.openConversationId;
    if (cid == null || typeof cid !== "number") return;
    if (deepLinkHandledConversationIdRef.current === cid) return;
    deepLinkHandledConversationIdRef.current = cid;

    const eid =
      route.params?.eventId != null &&
      typeof route.params.eventId === "number"
        ? route.params.eventId
        : EVENT_ID;
    const otherPartyName =
      typeof route.params?.otherPartyName === "string" &&
      route.params.otherPartyName.trim()
        ? route.params.otherPartyName.trim()
        : "Chat";

    void (async () => {
      let target = conversations.find((c) => c.id === cid);
      if (!target) {
        const loaded = await fetchConversations({ silent: true });
        target = loaded.find((c) => c.id === cid);
      }

      if (target) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === cid ? { ...c, unread_count: "0" } : c,
          ),
        );
      }
      try {
        await markConversationRead(eid, cid);
      } catch {
        // Non-blocking: unread badge will reconcile on the next refresh.
      }

      const avatarUri = target ? getConversationAvatarUri(target) : undefined;
      const displayName = target ? getConversationDisplayName(target) : otherPartyName;

      navigation.setParams({
        openConversationId: undefined,
        eventId: undefined,
        otherPartyName: undefined,
      });
      navigation.navigate("Conversation", {
        eventId: eid,
        conversationId: cid,
        otherPartyName: displayName,
        otherPartyAvatarUri: avatarUri,
      });
    })();
  }, [
    route.params?.openConversationId,
    route.params?.eventId,
    route.params?.otherPartyName,
    navigation,
    conversations,
    fetchConversations,
  ]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, c) => sum + getUnreadCount(c.unread_count),
        0
      ),
    [conversations]
  );

  const inboxExtraData = useMemo(
    () =>
      conversations
        .map(
          (c) =>
            `${c.id}:${c.unread_count}:${getConversationRowTimestamp(c)}`,
        )
        .join("|"),
    [conversations],
  );

  const openConversation = useCallback(
    async (item: ConversationListItem) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, unread_count: "0" } : c,
        ),
      );
      try {
        await markConversationRead(EVENT_ID, item.id);
      } catch {
        /* reconcile on next refresh */
      }

      navigation.navigate("Conversation", {
        eventId: EVENT_ID,
        conversationId: item.id,
        otherPartyName: getConversationDisplayName(item),
        otherPartyAvatarUri: getConversationAvatarUri(item),
      });
    },
    [navigation]
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="bg-white border-b border-neutral-100">
        <View className="flex-row items-center px-4 py-3">
          <Pressable onPress={() => navigation.goBack()} className="mr-3 p-1" hitSlop={10}>
            <ChevronLeftIcon size={24} color="#404040" />
          </Pressable>
          <Text className="flex-1 text-[20px] font-semibold text-neutral-900">
            Messages
          </Text>
          {totalUnread > 0 ? (
            <View className="min-w-[22px] h-[22px] rounded-full bg-[#1BB273] items-center justify-center px-1.5">
              <Text className="text-white text-xs font-bold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <SkeletonMessageList count={8} />
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-neutral-500 text-center mb-4">{error}</Text>
          <Pressable
            onPress={() => void fetchConversations()}
            className="bg-neutral-900 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          extraData={inboxExtraData}
          removeClippedSubviews={Platform.OS !== "android"}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void fetchConversations({ pull: true })}
              tintColor="#1BB273"
              colors={["#1BB273"]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Text className="text-neutral-900 font-semibold text-lg mb-2">
                No conversations yet
              </Text>
              <Text className="text-neutral-500 text-center">
                Start a chat from Connections and it will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = getUnreadCount(item.unread_count);
            const otherPartyName = getConversationDisplayName(item);
            const avatarUri = getConversationAvatarUri(item);
            const lastMessagePreview = getLastMessagePreview(item.last_message);
            const rowTimeIso = getConversationRowTimestamp(item);
            return (
              <Pressable
                onPress={() => void openConversation(item)}
                className="px-4 py-4 border-b border-neutral-100 bg-white"
              >
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        className="w-10 h-10 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-neutral-700 font-semibold">
                        {otherPartyName.slice(0, 1).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold text-neutral-900 flex-1 mr-2" numberOfLines={1}>
                        {otherPartyName}
                      </Text>
                      <Text className="text-xs text-neutral-500">
                        {formatConversationTime(rowTimeIso)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-1">
                      <Text
                        className={`text-sm flex-1 mr-3 ${
                          unread > 0 ? "text-neutral-900 font-medium" : "text-neutral-500"
                        }`}
                        numberOfLines={1}
                      >
                        {lastMessagePreview}
                      </Text>
                      {unread > 0 ? (
                        <View className="min-w-[20px] h-[20px] rounded-full bg-[#1BB273] items-center justify-center px-1">
                          <Text className="text-white text-[11px] font-bold">
                            {unread > 99 ? "99+" : unread}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
