import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";
import { useAuth } from "../context/AuthContext";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import {
  getTicketTypeDisplay,
  getTicketGradientColors,
  isLightTicketCard,
} from "../utils/ticketColors";

import {
  TicketsIcon,
  MailIcon,
  ProfileIcon,
  OffersIcon,
  TalentIcon,
  LogoutIcon,
  CloseIcon,
  UserAvatarIcon,
  ChevronRightIcon,
  HelpIcon,
  LightbulbIcon,
} from "./MenuIcons";
import { PeopleIcon } from "./BottomNavIcons";
import { getEventFeatures } from "../config/eventFeatures";

interface MenuProps {
  onClose: () => void;
  refreshTrigger?: number;
  onNavigate?: (route: string) => void;
  onLogout?: () => void;
  postEventMode?: boolean;
}

const LOADING_COLOR = "#475569";
const NEUTRAL_MENU_GRADIENT: [string, string] = ["#475569", "#64748B"];

export default function Menu({
  onClose,
  refreshTrigger,
  onNavigate,
  onLogout,
  postEventMode = false,
}: MenuProps) {
  const { user } = useAuth();
  const [ticketType, setTicketType] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(true);

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

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.first_name || user?.email?.split("@")[0] || "User";

  const userEmail = user?.email || "";
  const companyType = (user?.company?.company_type ?? "").trim();
  const ticketTypeTrimmed = ticketType?.trim() ?? "";
  const resolvedTier =
    !ticketLoading && (ticketTypeTrimmed || companyType)
      ? ticketTypeTrimmed || companyType
      : "";
  const tierPending = ticketLoading || resolvedTier === "";
  const display = tierPending
    ? { label: "...", color: LOADING_COLOR }
    : getTicketTypeDisplay(resolvedTier);
  const { label: userType } = display;
  const isLightCard = tierPending ? false : isLightTicketCard(resolvedTier);
  const cardGradient = tierPending
    ? NEUTRAL_MENU_GRADIENT
    : getTicketGradientColors(resolvedTier);
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
      label: "Startup Directory",
      icon: <PeopleIcon size={20} color="#444" />,
      route: "Startups",
    },
    {
      label: "Sponsor Directory",
      icon: <PeopleIcon size={20} color="#444" />,
      route: "Sponsors",
    },
    {
      label: "Founders",
      icon: <PeopleIcon size={20} color="#444" />,
      route: "Founders",
    },
    {
      label: "Investors",
      icon: <PeopleIcon size={20} color="#444" />,
      route: "Investors",
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
      label: "Tag Pickup",
      icon: <TicketsIcon size={20} color="#444" />,
      route: "TagPickup",
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

  const hiddenRoutes = new Set(getEventFeatures().hiddenMenuRoutes);
  const hiddenPostEventRoutes = new Set(["Offers", "Talent", "TagPickup"]);
  const visibleMenuItems = menuItems.filter((item) => {
    if (hiddenRoutes.has(item.route)) return false;
    if (postEventMode && hiddenPostEventRoutes.has(item.route)) return false;
    return true;
  });

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
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
          <View className="px-6 mt-4">
            <LinearGradient
              colors={cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-5 overflow-hidden"
            >
              <GuidelinePatternOverlay isLightCard={isLightCard} />
              <View className="flex-row items-start relative z-10">
                <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-4 overflow-hidden flex-shrink-0">
                  {profilePicUrl ? (
                    <Image
                      source={{ uri: profilePicUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <UserAvatarIcon size={28} color="#1BB273" />
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-start">
                    <View className="flex-1 min-w-0 pr-2">
                      <Text
                        className={`text-[18px] font-bold leading-snug ${
                          isLightCard ? "text-neutral-900" : "text-white"
                        }`}
                        numberOfLines={5}
                        ellipsizeMode="tail"
                      >
                        {userName}
                      </Text>
                    </View>
                    <View className="flex-shrink-0 max-w-[38%] pt-0.5">
                      <View
                        className={`px-2 py-[2px] rounded-full self-start ${
                          isLightCard ? "bg-neutral-900/10" : "bg-white/30"
                        }`}
                      >
                        <Text
                          className={`text-[12px] capitalize ${
                            isLightCard ? "text-neutral-700" : "text-white"
                          }`}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {userType}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text
                    className={`text-[14px] mt-1.5 ${
                      isLightCard ? "text-neutral-600" : "text-white/80"
                    }`}
                    numberOfLines={2}
                    ellipsizeMode="middle"
                  >
                    {userEmail}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View className="mt-6">
            {visibleMenuItems.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => onNavigate?.(item.route)}
                className="flex-row items-center py-4 border-b border-neutral-100 px-6"
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

          <Pressable
            onPress={() => onLogout?.()}
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
