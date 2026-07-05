import React from "react";
import { View, Text, Pressable } from "react-native";
import type { NowAndNextItem } from "../utils/nowAndNext";

interface NowAndNextStripProps {
  meeting: NowAndNextItem | null;
  session: NowAndNextItem | null;
  onPressMeeting?: () => void;
  onPressSession?: () => void;
}

function NextCard({
  item,
  onPress,
}: {
  item: NowAndNextItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 min-w-0 bg-white rounded-2xl border border-neutral-200 p-3.5 mr-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-[#1BB273] mb-1">
        {item.kind === "meeting" ? "Next meeting" : "Next session"} ·{" "}
        {item.countdown}
      </Text>
      <Text className="text-sm font-semibold text-black" numberOfLines={2}>
        {item.title}
      </Text>
      <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
        {item.subtitle}
      </Text>
    </Pressable>
  );
}

export default function NowAndNextStrip({
  meeting,
  session,
  onPressMeeting,
  onPressSession,
}: NowAndNextStripProps) {
  const hasNextCards = meeting || session;
  if (!hasNextCards) return null;

  return (
    <View className="px-4 mb-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
        Now & Next
      </Text>
      <View className="flex-row">
        {meeting ? (
          <NextCard item={meeting} onPress={onPressMeeting} />
        ) : null}
        {session ? (
          <NextCard item={session} onPress={onPressSession} />
        ) : null}
      </View>
    </View>
  );
}
