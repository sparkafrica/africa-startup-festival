import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import {
  getTicketTypeDisplay,
  getTicketGradientColors,
  isExhibitionPass,
} from "../utils/ticketColors";
// import PatternOverlay from "./ui/PatternOverlay";

import {
  TicketsIcon,
  MailIcon,
  ProfileIcon,
  MapIcon,
  OffersIcon,
  TalentIcon,
  LogoutIcon,
  CloseIcon,
  UserAvatarIcon,
  ChevronRightIcon,
  HelpIcon,
  LightbulbIcon,
} from "./MenuIcons";

interface MenuProps {
  onClose: () => void;
  refreshTrigger?: number;
  onNavigate?: (route: string) => void;
  onLogout?: () => void;
}

// Slate - neutral loading color to avoid green→blue flash for assignees
const LOADING_COLOR = "#475569";

export default function Menu({ onClose, refreshTrigger, onNavigate, onLogout }: MenuProps) {
  const { user } = useAuth();
  const [ticketType, setTicketType] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(true);

  // Fetch user's ticket to use its type for Menu card (color + badge)
  // Prefer type.name (canonical tier) over user_type so colors stay correct when backend updates pass type
  // bypassCache so we always get fresh pass type on open (avoids stale delegate/exhibitor after backend change)
  useEffect(() => {
    if (!user) {
      setTicketLoading(false);
      return;
    }
    setTicketLoading(true);
    ticketService
      .getUserTicket(EVENT_ID, { bypassCache: true })
      .then((ticket) => {
        const type =
          ticket?.type?.name ??
          ticket?.type?.user_type ??
          ticket?.ticket_class?.name ??
          ticket?.ticket_class?.user_type ??
          null;
        setTicketType(type ?? null);
      })
      .catch(() => setTicketType(null))
      .finally(() => setTicketLoading(false));
  }, [user?.user_id, refreshTrigger]);

  // Get user profile data
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.first_name || user?.email?.split("@")[0] || "User";

  const userEmail = user?.email || "";

  // Badge and color: prefer ticket type, then company type (so assignee with Exhibitor ticket shows Exhibitor)
  // While loading, use slate to avoid green flash before real ticket type loads
  const companyType = user?.company?.company_type ?? "";
  // Default to the lowest tier so the menu card starts white/black
  // (instead of flashing the Expo/green gradient before ticketType loads).
  const effectiveType = ticketType || companyType || "exhibition";
  const display = ticketLoading
    ? { label: "...", color: LOADING_COLOR }
    : getTicketTypeDisplay(effectiveType);
  const { label: userType, color: cardBackgroundColor } = display;
  const isExhibition = isExhibitionPass(effectiveType);
  const cardGradient = getTicketGradientColors(effectiveType);

  // Get profile picture URL if available
  const profilePicUrl = user?.profile_pic || null;

  const menuItems = [
    {
      label: "My Ticket(s)",
      icon: <TicketsIcon size={20} color="#444" />,
      route: "Tickets",
    },
    {
      label: "Messages",
      icon: <MailIcon size={20} color="#444" />,
      route: "Messages",
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
      label: "App Guide",
      icon: <HelpIcon size={20} color="#444" />,
      route: "AppGuide",
    },
    {
      label: "App Suggestions",
      icon: <LightbulbIcon size={20} color="#444" />,
      route: "AppSuggestions",
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
          {/* Profile Card – all types use left-to-right gradient */}
          <View className="px-6 mt-4">
            <LinearGradient
              colors={cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-5 overflow-hidden"
            >
              {/* <PatternOverlay opacity={0.30} /> */}
              <View className="flex-row items-center relative z-10">
                <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-4 overflow-hidden">
                  {profilePicUrl ? (
                    <Image source={{ uri: profilePicUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <UserAvatarIcon size={28} color="#1BB273" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text
                      className={`text-[18px] font-bold ${
                        isExhibition ? "text-neutral-900" : "text-white"
                      }`}
                    >
                      {userName}
                    </Text>
                    <View
                      className={`px-2 py-[2px] rounded-full ${
                        isExhibition ? "bg-neutral-900/10" : "bg-white/30"
                      }`}
                    >
                      <Text
                        className={`text-[12px] capitalize ${
                          isExhibition ? "text-neutral-700" : "text-white"
                        }`}
                      >
                        {userType}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={`text-[14px] mt-1 ${
                      isExhibition ? "text-neutral-600" : "text-white/80"
                    }`}
                  >
                    {userEmail}
                  </Text>
                </View>
              </View>
            </LinearGradient>
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
                  item.label === "App Guide" ? "px-6" : "px-6"
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
