import React from "react";
import { View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScanIcon, TicketIcon, BellIcon, MenuIcon } from "./HeaderIcons";
import { MailIcon } from "./MenuIcons";

interface HeaderBarProps {
  onScanPress?: () => void;
  onMyTicketPress?: () => void;
  onMessagesPress?: () => void;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  hasUnreadNotifications?: boolean;
  unreadMessagesCount?: number;
}

export default function HeaderBar({
  onScanPress,
  onMyTicketPress,
  onMessagesPress,
  onNotificationPress,
  onMenuPress,
  hasUnreadNotifications = false,
  unreadMessagesCount = 0,
}: HeaderBarProps) {
  const hasUnreadMessages = unreadMessagesCount > 0;
  const messagesBadgeLabel =
    unreadMessagesCount > 99 ? "99+" : String(unreadMessagesCount);

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-3 py-2.5">
        {/* Standalone actions — no borders */}
        <View className="flex-row items-center flex-1 min-w-0 mr-2">
          <Pressable
            onPress={onScanPress}
            className="flex-row items-center h-9 px-2 mr-1 flex-shrink-0"
            hitSlop={8}
          >
            <View className="w-5 h-5 items-center justify-center mr-1.5">
              <ScanIcon size={18} color="#404040" />
            </View>
            <Text className="font-semibold text-[#404040] text-sm">Scan</Text>
          </Pressable>
          {onMyTicketPress ? (
            <Pressable
              onPress={onMyTicketPress}
              className="flex-row items-center h-9 pl-1.5 pr-2 mr-0 min-w-0"
              style={{ flexShrink: 1 }}
              hitSlop={8}
            >
              <View className="w-5 h-5 items-center justify-center mr-1.5">
                <TicketIcon size={18} color="#404040" />
              </View>
              <View style={{ minWidth: 0, flexShrink: 1 }}>
                <Text
                  className="font-semibold text-[#404040] text-sm"
                  numberOfLines={1}
                >
                  My Ticket
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
        {/* Fixed-width cluster — standalone icon buttons, no borders */}
        <View className="flex-row items-center flex-shrink-0">
          <Pressable
            onPress={onNotificationPress}
            className="w-9 h-9 items-center justify-center"
            hitSlop={8}
          >
            <BellIcon size={20} color="#404040" />
            {hasUnreadNotifications && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#22C55E",
                  borderWidth: 2,
                  borderColor: "#FFF",
                }}
              />
            )}
          </Pressable>
          <Pressable
            onPress={onMessagesPress}
            className="w-9 h-9 items-center justify-center ml-0.5"
            hitSlop={8}
          >
            <MailIcon size={20} color="#404040" />
            {hasUnreadMessages && (
              <View
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#22C55E",
                  borderWidth: 1.5,
                  borderColor: "#FFF",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {messagesBadgeLabel}
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={onMenuPress}
            className="w-9 h-9 items-center justify-center ml-0.5"
            hitSlop={8}
          >
            <MenuIcon size={20} color="#404040" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
