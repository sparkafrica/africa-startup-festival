import React from "react";
import { View, Text } from "react-native";

export default function TimeZoneAlertBanner() {
  return (
    <View className="bg-orange-100 rounded-lg px-4 py-3 mx-4 mb-4">
      <Text className="text-gray-900 text-sm leading-5">
        Schedule is shown in event time zone. Double-check before adding to your
        schedule.
      </Text>
    </View>
  );
}
