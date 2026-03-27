/**
 * ConversationScreen – 1:1 thread view: message list + composer.
 * Route params: eventId, conversationId, otherPartyName.
 */

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { LoadingSpinner } from "../components";
import { useChat, type LocalChatMessage } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { addPusherConnectionStateListener } from "../services/pusherChatService";
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

/** API may return newest-first or oldest-first; normalize for inverted FlatList (newest near composer). */
function sortMessagesForInvertedChat(list: LocalChatMessage[]): LocalChatMessage[] {
  if (list.length <= 1) return [...list];
  return [...list].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    const na = Number.isFinite(ta) ? ta : 0;
    const nb = Number.isFinite(tb) ? tb : 0;
    if (na !== nb) return na - nb;
    return a.id - b.id;
  }).reverse();
}

export default function ConversationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList, "Conversation">>();
  const route = useRoute<RouteProp<RootStackParamList, "Conversation">>();
  const { eventId, conversationId, otherPartyName, otherPartyAvatarUri } =
    route.params;
  const { user } = useAuth();
  const {
    messagesByConversationId,
    loading,
    error,
    clearError,
    loadConversation,
    sendMessage,
    bindConversationRealtime,
    unbindConversationRealtime,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const messages = messagesByConversationId[conversationId] ?? [];
  /** Newest first — with inverted FlatList, index 0 sits above the composer (WhatsApp-style). */
  const listData = useMemo(() => sortMessagesForInvertedChat(messages), [messages]);

  useEffect(() => {
    if (listData.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, [listData.length, conversationId]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      (async () => {
        await loadConversation(eventId, conversationId);
        if (!isActive) return;
        await bindConversationRealtime(eventId, conversationId);
      })();

      return () => {
        isActive = false;
        void unbindConversationRealtime(conversationId);
      };
    }, [
      eventId,
      conversationId,
      loadConversation,
      bindConversationRealtime,
      unbindConversationRealtime,
    ])
  );

  useEffect(() => {
    if (error) clearError();
  }, [conversationId, error, clearError]);

  // Auto-reload after websocket reconnect to catch messages possibly missed while offline/backgrounded.
  useEffect(() => {
    const removeListener = addPusherConnectionStateListener((current, previous) => {
      if (current !== "CONNECTED") return;
      if (previous === "CONNECTED") return;
      void loadConversation(eventId, conversationId);
    });
    return removeListener;
  }, [eventId, conversationId, loadConversation]);

  // Option B (Android): measure actual keyboard height so we can pad
  // the composer/list above it instead of relying on OS pan behavior.
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText("");
    void sendMessage(eventId, conversationId, trimmed);
  };

  const isMine = (msg: LocalChatMessage): boolean => {
    return user?.email != null && msg.sender_email === user.email;
  };

  const renderMessage = ({ item }: { item: LocalChatMessage }) => {
    const mine = isMine(item);
    return (
      <View
        className={`mb-3 ${mine ? "items-end" : "items-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
            mine ? "bg-neutral-900" : "bg-neutral-100"
          }`}
        >
          <Text
            className={`text-base ${mine ? "text-white" : "text-neutral-900"}`}
            selectable
          >
            {item.content}
          </Text>
          <Text
            className={`text-xs mt-1 ${mine ? "text-neutral-400" : "text-neutral-500"}`}
          >
            {mine
              ? item.client_status === "pending"
                ? `${formatMessageTime(item.timestamp)}  •  Sending...`
                : item.client_status === "failed"
                  ? `${formatMessageTime(item.timestamp)}  •  Failed`
                  : formatMessageTime(item.timestamp)
              : formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </View>
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
      {/* Header: back + title */}
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
        <View className="flex-1 items-center justify-center py-20">
          <LoadingSpinner size="large" />
          <Text className="text-neutral-500 mt-3">Loading messages...</Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="px-4 py-2 bg-red-50">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
            className="flex-1"
          >
            <View className="flex-1">
              <FlatList
                ref={listRef}
                inverted
                data={listData}
                renderItem={renderMessage}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{
                  flexGrow: listData.length === 0 ? 1 : undefined,
                  // Inverted list: paddingTop is the gap toward the composer / keyboard.
                  paddingTop:
                    Platform.OS === "android" && keyboardHeight > 0
                      ? keyboardHeight + 10
                      : 16,
                  paddingBottom: 16,
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

            <View className="flex-row items-end px-4 py-4 bg-white border-t border-neutral-100"
              style={{
                paddingBottom:
                  Platform.OS === "android"
                    ? keyboardHeight > 0
                      ? keyboardHeight + 30
                      : 25
                    : 22,
              }}
            >
              <TextInput
                className="flex-1 bg-neutral-100 rounded-xl px-4 py-4 text-base text-neutral-900 max-h-32"
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
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}
