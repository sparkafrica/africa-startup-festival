import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";

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
  VideoIcon,
} from "./MenuIcons";

interface MenuProps {
  onClose: () => void;
  onNavigate?: (route: string) => void;
  onLogout?: () => void;
}

export default function Menu({ onClose, onNavigate, onLogout }: MenuProps) {
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
    {
      label: "App Guide Video",
      icon: <VideoIcon size={20} color="#444" />,
      route: "AppGuide",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-200">
          <Text className="text-[24px] font-bold text-neutral-900">Menu</Text>

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
              className="rounded-2xl p-5 overflow-hidden"
              style={{ backgroundColor: "#1BB273" }}
            >
              {/* Decorative Background Graphics */}
              <View className="absolute inset-0 opacity-20">
                <Svg width="100%" height="100%" viewBox="0 0 200 120">
                  {/* Treble Clef */}
                  <Path
                    d="M20 20C20 20 25 15 30 18C35 21 35 30 30 40C25 50 20 60 25 70C30 80 40 85 50 80C60 75 65 65 60 55C55 45 50 35 55 25C60 15 70 10 80 15C90 20 95 30 90 40C85 50 80 60 85 70C90 80 100 85 110 80"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Musical Note 1 */}
                  <Circle cx="140" cy="30" r="3" fill="white" />
                  <Path
                    d="M140 30L140 50M140 50L150 45"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Musical Note 2 */}
                  <Circle cx="160" cy="50" r="3" fill="white" />
                  <Path
                    d="M160 50L160 70M160 70L170 65"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Musical Note 3 */}
                  <Circle cx="120" cy="70" r="3" fill="white" />
                  <Path
                    d="M120 70L120 90M120 90L130 85"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>

              <View className="flex-row items-center relative z-10">
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
                }}
                className={`flex-row items-center py-4 border-b border-neutral-100 ${
                  item.label === "App Guide Video" ? "px-6" : "px-6"
                }`}
              >
                <View className="w-8 mr-2 flex-shrink-0">{item.icon}</View>

                <Text
                  className="flex-1 text-[16px] font-normal text-neutral-900"
                  numberOfLines={1}
                  style={{ flexShrink: 1 }}
                >
                  {item.label}
                </Text>

                <View className="ml-2 flex-shrink-0">
                  <ChevronRightIcon size={18} color="#C4C4C4" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Logout */}
          <Pressable
            onPress={() => {
              onLogout?.();
            }}
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
