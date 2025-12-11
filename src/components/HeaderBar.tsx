import React from "react";
import { View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import IconButton from "./IconButton";
import { ScanIcon, BellIcon, MenuIcon } from "./HeaderIcons";

interface HeaderBarProps {
  onScanPress?: () => void;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function HeaderBar({
  onScanPress,
  onNotificationPress,
  onMenuPress,
  hasUnreadNotifications = false,
}: HeaderBarProps) {
  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={onScanPress}
            className="flex-row items-center bg-[#fefefe] rounded-full h-10 px-3 mr-3 border border-[#c6c6c6]"
            style={{
              shadowColor: "#fefefe",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.09,
              shadowRadius: 3,
              elevation: 2,
            }}
            hitSlop={10}
          >
            <View className="w-6 h-6 bg-[#fefefe] rounded-full items-center justify-center mr-2">
              <ScanIcon size={20} color="#404040" />
            </View>
            <Text className="font-semibold text-[#404040] text-base">Scan</Text>
          </Pressable>
          <Pressable
            onPress={onNotificationPress}
            className="w-10 h-10 rounded-full bg-[#fefefe] border border-[#c6c6c6] items-center justify-center"
            style={{
              shadowColor: "#2762C7",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.09,
              shadowRadius: 3,
              elevation: 2,
            }}
            hitSlop={10}
          >
            <BellIcon size={18} color="#404040" />
            {/* Red notification dot - only shown when there are unread notifications */}
            {hasUnreadNotifications && (
              <View
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 9,
                  height: 9,
                  borderRadius: 4.5,
                  backgroundColor: "#F04D52",
                  borderWidth: 2,
                  borderColor: "#FFF",
                }}
              />
            )}
          </Pressable>
        </View>
        <Pressable onPress={onMenuPress} className="p-2">
          <View
            style={{
              borderWidth: 1,
              borderColor: "#c6c6c6",
              borderRadius: 9999,
              padding: 6,
            }}
          >
            <MenuIcon size={20} color="#404040" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
