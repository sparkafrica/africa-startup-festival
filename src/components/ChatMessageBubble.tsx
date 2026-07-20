import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { LocalChatMessage } from "../context/ChatContext";

const SWIPE_REPLY_THRESHOLD = 48;
const MAX_DRAG = 72;

type Props = {
  item: LocalChatMessage;
  mine: boolean;
  timeLabel: string;
  onReply: (message: LocalChatMessage) => void;
};

function ReplyQuote({
  replyTo,
  mine,
}: {
  replyTo: NonNullable<LocalChatMessage["reply_to"]>;
  mine: boolean;
}) {
  return (
    <View
      style={[
        styles.replyQuote,
        mine ? styles.replyQuoteMine : styles.replyQuoteTheirs,
      ]}
    >
      <Text
        style={[styles.replyName, mine ? styles.replyNameMine : styles.replyNameTheirs]}
        numberOfLines={1}
      >
        {replyTo.sender_name || "Message"}
      </Text>
      <Text
        style={[styles.replyText, mine ? styles.replyTextMine : styles.replyTextTheirs]}
        numberOfLines={2}
      >
        {replyTo.content}
      </Text>
    </View>
  );
}

export default function ChatMessageBubble({
  item,
  mine,
  timeLabel,
  onReply,
}: Props) {
  const translateX = useSharedValue(0);
  const replyTriggered = useSharedValue(false);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      const drag = mine
        ? Math.min(0, Math.max(-MAX_DRAG, e.translationX))
        : Math.max(0, Math.min(MAX_DRAG, e.translationX));
      translateX.value = drag;
      if (
        !replyTriggered.value &&
        Math.abs(drag) >= SWIPE_REPLY_THRESHOLD
      ) {
        replyTriggered.value = true;
        runOnJS(onReply)(item);
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      replyTriggered.value = false;
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      replyTriggered.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.row,
          mine ? styles.rowMine : styles.rowTheirs,
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          {item.reply_to ? (
            <ReplyQuote replyTo={item.reply_to} mine={mine} />
          ) : null}
          <Text
            style={[styles.body, mine ? styles.bodyMine : styles.bodyTheirs]}
            selectable
          >
            {item.content}
          </Text>
          <Text
            style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}
          >
            {timeLabel}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rowMine: {
    alignItems: "flex-end",
  },
  rowTheirs: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: "#171717",
  },
  bubbleTheirs: {
    backgroundColor: "#F5F5F5",
  },
  body: {
    fontSize: 16,
  },
  bodyMine: {
    color: "#FFFFFF",
  },
  bodyTheirs: {
    color: "#171717",
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  timeMine: {
    color: "#A3A3A3",
  },
  timeTheirs: {
    color: "#737373",
  },
  replyQuote: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
    borderRadius: 0,
  },
  replyQuoteMine: {
    borderLeftColor: "#1BB273",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  replyQuoteTheirs: {
    borderLeftColor: "#1BB273",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  replyName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyNameMine: {
    color: "#1BB273",
  },
  replyNameTheirs: {
    color: "#059669",
  },
  replyText: {
    fontSize: 13,
  },
  replyTextMine: {
    color: "#D4D4D4",
  },
  replyTextTheirs: {
    color: "#525252",
  },
});
