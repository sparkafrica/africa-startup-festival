import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { UserPlusIcon } from "./icons";
import AnimatedArrowRightIcon from "./AnimatedArrowRightIcon";

export function StartupJoinReminderBanner({
  pendingCount,
}: {
  pendingCount: number;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (pendingCount <= 0) return null;

  const requestLabel =
    pendingCount === 1
      ? "1 startup request needs review"
      : `${pendingCount} startup requests need review`;

  return (
    <Pressable
      onPress={() => navigation.navigate("Profile", { openStartupTab: true })}
      accessibilityRole="button"
      accessibilityLabel={`${requestLabel}. Review requests.`}
      accessibilityHint="Opens the Startup profile where you can approve or decline requests"
      className="mx-4 mb-4 border border-amber-200 bg-amber-50 overflow-hidden"
      style={({ pressed }) => ({
        borderRadius: 16,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View className="flex-row items-center px-4 py-4">
        <View className="w-11 h-11 rounded-full bg-amber-100 items-center justify-center flex-shrink-0">
          <UserPlusIcon size={23} color="#78350F" />
        </View>

        <View className="flex-1 min-w-0 ml-3 mr-3">
          <Text className="text-sm font-semibold text-amber-950 leading-5">
            {requestLabel}
          </Text>
          <Text className="text-xs text-amber-800 mt-0.5 leading-4">
            Approve or decline applicants waiting to join your startup.
          </Text>
          <Text className="text-xs font-semibold text-neutral-900 mt-2">
            Review requests
          </Text>
        </View>

        <View className="w-9 h-9 rounded-full bg-black items-center justify-center flex-shrink-0">
          <AnimatedArrowRightIcon size={17} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}
