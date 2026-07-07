import React from "react";
import { View, Text } from "react-native";

export function StartupBadge({
  companyName,
  compact = false,
}: {
  companyName: string;
  compact?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center rounded-full bg-neutral-900 ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
    >
      <Text
        className={`text-white font-semibold ${compact ? "text-[10px]" : "text-xs"}`}
        numberOfLines={1}
      >
        {compact ? companyName : `Startup · ${companyName}`}
      </Text>
    </View>
  );
}

export function StartupPendingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View
      className={`rounded-full bg-amber-100 border border-amber-200 ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
    >
      <Text
        className={`font-medium text-amber-800 ${compact ? "text-[10px]" : "text-xs"}`}
      >
        Join pending
      </Text>
    </View>
  );
}
