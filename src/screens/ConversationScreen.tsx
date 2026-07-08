/**
 * ConversationScreen – 1:1 thread view: message list + composer.
 * Route params: eventId, conversationId, otherPartyName.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  Image,
  Dimensions,
  Alert,
  type KeyboardEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { SkeletonMessageList } from "../components";
import ChatMessageBubble from "../components/ChatMessageBubble";
import ChatWatermark from "../components/ChatWatermark";
import { useChat, type LocalChatMessage } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useMessagesBadgeContext } from "../context/MessagesBadgeContext";
import { markConversationRead } from "../services/chatService";
import type { MessageReplyTo } from "../services/chatService";
import { addPusherConnectionStateListener } from "../services/pusherChatService";
import { emitInboxRead } from "../utils/chatInboxSync";
import {
  isPeerMessagingEligible,
  loadMessagingEligiblePeerIds,
} from "../utils/messagingEligibility";
import { MESSAGING_ACCESS_REQUIRED_MESSAGE } from "../utils/asfNetworking";
import Svg, { Path } from "react-native-svg";

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function sortMessagesForInvertedChat(list: LocalChatMessage[]): LocalChatMessage[] {
  if (list.length <= 1) return [...list];
  return [...list]
    .sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      const na = Number.isFinite(ta) ? ta : 0;
      const nb = Number.isFinite(tb) ? tb : 0;
      if (na !== nb) return na - nb;
      return a.id - b.id;
    })
    .reverse();
}

/** iOS: lift composer flush to keyboard top. */
function iosComposerInsetFromEvent(e: KeyboardEvent): number {
  const screenY = e.endCoordinates?.screenY;
  if (typeof screenY === "number" && screenY > 0) {
    const windowH = Dimensions.get("window").height;
    return Math.max(0, windowH - screenY);
  }
  return Math.max(0, e.endCoordinates?.height ?? 0);
}

export default function ConversationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList, "Conversation">>();
  const route = useRoute<RouteProp<RootStackParamList, "Conversation">>();
  const insets = useSafeAreaInsets();
  const { eventId, conversationId, otherPartyName, otherPartyAvatarUri, otherPartyUserId } =
    route.params;
  const { user } = useAuth();
  const { refresh: refreshMessagesBadge } = useMessagesBadgeContext();
  const {
    messagesByConversationId,
    loading,
    error,
    clearError,
    loadConversation,
    refreshConversation,
    sendMessage,
    bindConversationRealtime,
    unbindConversationRealtime,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageReplyTo | null>(null);
  const [iosComposerInset, setIosComposerInset] = useState(0);
  const [canSendMessages, setCanSendMessages] = useState(true);
  const listRef = useRef<FlatList>(null);
  const markedReadThisVisitRef = useRef(false);
  const messagingBlockedAlertShownRef = useRef(false);

  const messages = messagesByConversationId[conversationId] ?? [];
  const listData = useMemo(() => sortMessagesForInvertedChat(messages), [messages]);
  /** Android inverted FlatList needs extraData or new rows may not paint until remount. */
  const listExtraData = useMemo(() => {
    const head = listData[0];
    return head
      ? `${listData.length}-${head.id}-${head.timestamp}`
      : String(listData.length);
  }, [listData]);

  const composerBottomPad =
    Platform.OS === "ios"
      ? iosComposerInset > 0
        ? iosComposerInset + 6
        : Math.max(insets.bottom, 8)
      : Math.max(insets.bottom, 10);

  const markThreadRead = useCallback(async () => {
    try {
      await markConversationRead(eventId, conversationId);
      emitInboxRead({ conversationId });
      void refreshMessagesBadge({ force: true });
    } catch {
      /* badge reconciles on next inbox refresh */
    }
  }, [eventId, conversationId, refreshMessagesBadge]);

  useEffect(() => {
    if (listData.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, [listData.length, conversationId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      markedReadThisVisitRef.current = false;
      messagingBlockedAlertShownRef.current = false;

      (async () => {
        const peerId = String(otherPartyUserId ?? "").trim();
        const currentUserId = String(user?.user_id ?? "").trim();
        if (peerId && currentUserId) {
          const { eligiblePeerIds } = await loadMessagingEligiblePeerIds(
            currentUserId
          );
          if (!isActive) return;
          const allowed = isPeerMessagingEligible(peerId, eligiblePeerIds);
          setCanSendMessages(allowed);
          if (!allowed && !messagingBlockedAlertShownRef.current) {
            messagingBlockedAlertShownRef.current = true;
            Alert.alert("Messaging unavailable", MESSAGING_ACCESS_REQUIRED_MESSAGE, [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
            return;
          }
        } else {
          setCanSendMessages(true);
        }

        await loadConversation(eventId, conversationId);
        if (!isActive) return;
        await bindConversationRealtime(eventId, conversationId);
        if (!isActive) return;
        markedReadThisVisitRef.current = true;
        await markThreadRead();
      })();

      return () => {
        isActive = false;
        void unbindConversationRealtime(conversationId);
        void refreshMessagesBadge({ force: true });
      };
    }, [
      eventId,
      conversationId,
      otherPartyUserId,
      user?.user_id,
      loadConversation,
      bindConversationRealtime,
      unbindConversationRealtime,
      markThreadRead,
      refreshMessagesBadge,
      navigation,
    ]),
  );

  /** Android: Pusher delivery is flaky — poll while thread is open so DMs stay live. */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return undefined;
      const intervalId = setInterval(() => {
        void refreshConversation(eventId, conversationId).then(() => {
          void markThreadRead();
        });
      }, 3000);
      return () => clearInterval(intervalId);
    }, [eventId, conversationId, refreshConversation, markThreadRead]),
  );

  useEffect(() => {
    if (error) clearError();
  }, [conversationId, error, clearError]);

  useEffect(() => {
    const removeListener = addPusherConnectionStateListener((current, previous) => {
      if (current !== "CONNECTED") return;
      if (previous === "CONNECTED") return;
      void loadConversation(eventId, conversationId);
    });
    return removeListener;
  }, [eventId, conversationId, loadConversation]);

  // iOS only — Android uses native `pan` (app.json); no JS keyboard compensation.
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const onShow = (e: KeyboardEvent) => {
      setIosComposerInset(iosComposerInsetFromEvent(e));
    };
    const onHide = () => setIosComposerInset(0);

    const showSub = Keyboard.addListener("keyboardWillShow", onShow);
    const hideSub = Keyboard.addListener("keyboardWillHide", onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !canSendMessages) return;

    setInputText("");
    const reply = replyingTo ?? undefined;
    setReplyingTo(null);
    void sendMessage(eventId, conversationId, trimmed, { replyTo: reply });
    void markThreadRead();
  };

  const isMine = (msg: LocalChatMessage): boolean => {
    return user?.email != null && msg.sender_email === user.email;
  };

  const handleReply = useCallback((message: LocalChatMessage) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      sender_name: message.sender_name || "Message",
    });
  }, []);

  const renderMessage = ({ item }: { item: LocalChatMessage }) => {
    const mine = isMine(item);
    const timeLabel = mine
      ? item.client_status === "pending"
        ? `${formatMessageTime(item.timestamp)}  •  Sending...`
        : item.client_status === "failed"
          ? `${formatMessageTime(item.timestamp)}  •  Failed`
          : formatMessageTime(item.timestamp)
      : formatMessageTime(item.timestamp);

    return (
      <ChatMessageBubble
        item={item}
        mine={mine}
        timeLabel={timeLabel}
        onReply={handleReply}
      />
    );
  };

  const SendIcon = ({ size = 18, color = "#FFFFFF" }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="bg-white border-b border-neutral-100">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3 p-1"
            hitSlop={10}
          >
            <ChevronLeftIcon size={24} color="#404040" />
          </Pressable>
          <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
            {typeof otherPartyAvatarUri === "string" &&
            otherPartyAvatarUri.trim().length ? (
              <Image
                source={{ uri: otherPartyAvatarUri }}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-neutral-700 font-semibold">
                {(otherPartyName || "Chat").slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
          <Text
            className="flex-1 text-[20px] font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {otherPartyName || "Chat"}
          </Text>
        </View>
      </SafeAreaView>

      {loading && messages.length === 0 ? (
        <SkeletonMessageList count={6} />
      ) : (
        <View className="flex-1">
          {error ? (
            <View className="px-4 py-2 bg-red-50">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="flex-1">
            <ChatWatermark />
            <FlatList
              ref={listRef}
              inverted
              data={listData}
              extraData={listExtraData}
              removeClippedSubviews={Platform.OS !== "android"}
              renderItem={renderMessage}
              keyExtractor={(item) => item.client_temp_id ?? String(item.id)}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{
                flexGrow: listData.length === 0 ? 1 : undefined,
                paddingTop: 12,
                paddingBottom: 12,
              }}
              ListEmptyComponent={
                <View className="flex-1 justify-center py-12 px-4 items-center min-h-[200px]">
                  <Text className="text-neutral-500 text-center">
                    No messages yet. Say hello!
                  </Text>
                </View>
              }
            />
          </View>

          {replyingTo ? (
            <View className="px-4 pt-2 pb-1 bg-white border-t border-neutral-100">
              <View className="flex-row items-center bg-neutral-50 rounded-xl px-3 py-2 border-l-4 border-[#1BB273]">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-semibold text-[#059669]" numberOfLines={1}>
                    Replying to {replyingTo.sender_name}
                  </Text>
                  <Text className="text-sm text-neutral-600 mt-0.5" numberOfLines={2}>
                    {replyingTo.content}
                  </Text>
                </View>
                <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
                  <Text className="text-neutral-500 text-lg px-1">×</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View
            className="flex-row items-end px-4 pt-2 bg-white border-t border-neutral-100"
            style={{ paddingBottom: composerBottomPad }}
          >
            {!canSendMessages ? (
              <View className="flex-1 py-3 px-2">
                <Text className="text-sm text-neutral-500 text-center">
                  {MESSAGING_ACCESS_REQUIRED_MESSAGE}
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  className="flex-1 bg-neutral-100 rounded-xl px-4 py-3 text-base text-neutral-900 max-h-32"
                  placeholder="Message..."
                  placeholderTextColor="#A3A3A3"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <Pressable
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                  className="ml-2 w-11 h-11 rounded-full bg-neutral-900 items-center justify-center"
                >
                  <SendIcon size={22} color="#FFFFFF" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
