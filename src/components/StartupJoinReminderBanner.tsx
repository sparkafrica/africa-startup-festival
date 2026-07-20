import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";

export function StartupJoinReminderBanner({
  pendingCount,
}: {
  pendingCount: number;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (pendingCount <= 0) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate("Profile", { openStartupTab: true })}
      className="mx-4 mb-4 border border-amber-200 bg-amber-50 px-4 py-3"
      style={{ borderRadius: 0 }}
    >
      <Text className="text-sm font-semibold text-amber-900">
        {pendingCount === 1
          ? "1 startup join request needs your review"
          : `${pendingCount} startup join requests need your review`}
      </Text>
      <Text className="text-xs text-amber-800 mt-1">
        Tap to open your Startup profile and approve or decline.
      </Text>
    </Pressable>
  );
}
