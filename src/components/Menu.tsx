import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  TicketsIcon,
  ProfileIcon,
  MapIcon,
  OffersIcon,
  TalentIcon,
  MailIcon,
  LogoutIcon,
  CloseIcon,
  UserAvatarIcon,
  ChevronRightIcon,
} from "./MenuIcons";

interface MenuProps {
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export default function Menu({ onClose, onNavigate }: MenuProps) {
  const menuItems = [
    {
      label: "My Tickets",
      icon: <TicketsIcon size={20} color="#444" />,
      route: "Tickets",
    },
    {
      label: "Manage Profile",
      icon: <ProfileIcon size={20} color="#444" />,
      route: "Profile",
    },
    {
      label: "Venue Map",
      icon: <MapIcon size={20} color="#444" />,
      route: "Map",
    },
    {
      label: "Partner Offers",
      icon: <OffersIcon size={20} color="#444" />,
      route: "Offers",
    },
    {
      label: "Talent Board",
      icon: <TalentIcon size={20} color="#444" />,
      route: "Talent",
    },
    {
      label: "Contact Us",
      icon: <MailIcon size={20} color="#444" />,
      route: "Contact",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-200">
          <Text className="text-[20px] font-bold text-neutral-900">Menu</Text>

          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full border border-neutral-300 items-center justify-center"
          >
            <CloseIcon size={20} color="#444" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Profile Card */}
          <View className="px-6 mt-4">
            <View
              className="rounded-2xl p-5"
              style={{ backgroundColor: "#1BB273" }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-4">
                  <UserAvatarIcon size={28} color="#1BB273" />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-white text-[18px] font-bold">
                      John Doe
                    </Text>

                    <View className="px-2 py-[2px] bg-white/30 rounded-full">
                      <Text className="text-white text-[12px]">Attendee</Text>
                    </View>
                  </View>

                  <Text className="text-white/80 text-[14px] mt-1">
                    john.doe@email.com
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="mt-6">
            {menuItems.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  onNavigate?.(item.route);
                  onClose();
                }}
                className="flex-row items-center px-6 py-4 border-b border-neutral-100"
              >
                <View className="w-8 mr-4">{item.icon}</View>

                <Text className="flex-1 text-[16px] text-neutral-900">
                  {item.label}
                </Text>

                <ChevronRightIcon size={18} color="#C4C4C4" />
              </Pressable>
            ))}
          </View>

          {/* Logout */}
          <Pressable
            onPress={() => console.log("Logout")}
            className="flex-row items-center px-6 py-5 mt-4"
          >
            <LogoutIcon size={20} color="#FF4D4F" />
            <Text className="text-[16px] text-red-500 font-medium ml-3">
              Log out
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
