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
        {/* Pills only — flex-1 so they shrink; never draw over trailing icons */}
        <View className="flex-row items-center flex-1 min-w-0 mr-2">
          <Pressable
            onPress={onScanPress}
            className="flex-row items-center bg-[#fefefe] rounded-full h-9 px-2.5 mr-1.5 border border-[#c6c6c6] flex-shrink-0"
            style={{
              shadowColor: "#fefefe",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.09,
              shadowRadius: 3,
              elevation: 2,
            }}
            hitSlop={8}
          >
            <View className="w-5 h-5 bg-[#fefefe] rounded-full items-center justify-center mr-1.5">
              <ScanIcon size={18} color="#404040" />
            </View>
            <Text className="font-semibold text-[#404040] text-sm">Scan</Text>
          </Pressable>
          {onMyTicketPress ? (
            <Pressable
              onPress={onMyTicketPress}
              className="flex-row items-center bg-[#fefefe] rounded-full h-9 pl-2 pr-2.5 mr-0 border border-[#c6c6c6] min-w-0"
              style={{
                flexShrink: 1,
                shadowColor: "#fefefe",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.09,
                shadowRadius: 3,
                elevation: 2,
              }}
              hitSlop={8}
            >
              <View className="w-5 h-5 bg-[#fefefe] rounded-full items-center justify-center mr-1.5">
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
        {/* Fixed-width cluster — always reserved so menu never overlaps */}
        <View className="flex-row items-center flex-shrink-0">
          <Pressable
            onPress={onNotificationPress}
            className="w-9 h-9 rounded-full bg-[#fefefe] border border-[#c6c6c6] items-center justify-center"
            style={{
              shadowColor: "#2762C7",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.09,
              shadowRadius: 3,
              elevation: 2,
            }}
            hitSlop={8}
          >
            <BellIcon size={17} color="#404040" />
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
            className="w-9 h-9 rounded-full bg-[#fefefe] border border-[#c6c6c6] items-center justify-center ml-1.5"
            style={{
              shadowColor: "#2762C7",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.09,
              shadowRadius: 3,
              elevation: 2,
            }}
            hitSlop={8}
          >
            <MailIcon size={17} color="#404040" />
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
          <Pressable onPress={onMenuPress} className="ml-1.5 p-1">
            <View
              style={{
                borderWidth: 1,
                borderColor: "#c6c6c6",
                borderRadius: 9999,
                padding: 5,
              }}
            >
              <MenuIcon size={19} color="#404040" />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
