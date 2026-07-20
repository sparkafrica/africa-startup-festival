import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { brand, typography } from "../theme/theme";

/**
 * Placeholder Floor Plan screen — content (map / image) to be added later.
 */
export default function FloorPlanScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-neutral-200">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-3 p-1"
          hitSlop={12}
        >
          <ChevronLeftIcon size={28} color={brand.black} />
        </Pressable>
        <Text
          style={{
            fontFamily: typography.fontFamily["inter-bold"],
            fontSize: 22,
            color: brand.black,
          }}
        >
          Floor Plan
        </Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.sans,
            fontSize: 15,
            color: "#737373",
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Floor plan coming soon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
