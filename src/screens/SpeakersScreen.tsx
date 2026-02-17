import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Pressable, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { navigate as navigateRef } from "../navigation/navigationRef";
import { useMeetingsBadgeCount } from "../hooks";
import { useNotifications } from "../context/NotificationsContext";
import { eventService } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import {
  HeaderBar,
  SpeakerCard,
  BottomNavigation,
  FilterTag,
  FilterModal,
  LoadingSpinner,
  type FilterCategory,
} from "../components";
import { ChevronLeftIcon, FilterIcon } from "../components/HeaderIcons";
import { ChevronDownIcon } from "../components/icons";
import {
  HomeIcon,
  HomeIconFilled,
  PeopleIcon,
  PeopleIconFilled,
  CalendarIcon,
  CalendarIconFilled,
  ClockIcon,
  ClockIconFilled,
  HeartIcon,
  HeartIconFilled,
} from "../components/BottomNavIcons";

export default function SpeakersScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Speakers">>();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { hasUnreadNotifications } = useNotifications();
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // State for speakers data
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filterCategories: FilterCategory[] = [
    {
      id: "industry",
      title: "Industry / Sector",
      options: [
        { id: "technology", label: "Technology" },
        { id: "fintech", label: "Fintech" },
        { id: "healthcare", label: "Healthcare" },
        { id: "education", label: "Education" },
        { id: "sustainability", label: "Sustainability" },
        { id: "ecommerce", label: "E-commerce" },
        { id: "transportation", label: "Transportation" },
      ],
    },
    {
      id: "interests",
      title: "Interests",
      options: [
        { id: "ai-ml", label: "AI/ML" },
        { id: "saas", label: "SaaS" },
        { id: "product-strategy", label: "Product Strategy" },
        { id: "ecommerce-interest", label: "E-commerce" },
        { id: "fintech-interest", label: "Fintech" },
        { id: "developer-tools", label: "Developer Tools" },
        { id: "infrastructure", label: "Infrastructure" },
        { id: "growth-marketing", label: "Growth Marketing" },
      ],
    },
    {
      id: "job-title",
      title: "Job Title / Role",
      options: [
        { id: "ceo-founder", label: "CEO/Founder" },
        { id: "cto", label: "CTO" },
        { id: "vp-product", label: "VP Product" },
        { id: "sales", label: "Sales" },
        { id: "designer", label: "Designer" },
        { id: "engineer", label: "Engineer" },
        { id: "marketing", label: "Marketing" },
        { id: "product-manager", label: "Product Manager" },
      ],
    },
  ];

  // TODO: BACKEND INTEGRATION - Apply filters via API call
  // API Endpoint: GET /api/speakers?filters={encodedFilters}
  // TODO: BACKEND - Encode filter IDs into query params
  // TODO: BACKEND - Refetch speakers when filters change
  const handleApplyFilters = (filterIds: string[]) => {
    setSelectedFilterIds(filterIds);
    // TODO: BACKEND - Call API with filters: await api.get(`/speakers?filters=${encodeFilters(filterIds)}`)
  };

  // Helper function to get filter label from ID
  const getFilterLabel = (id: string): string => {
    for (const category of filterCategories) {
      const option = category.options.find((opt) => opt.id === id);
      if (option) return option.label;
    }
    return id;
  };

  // Fetch all speakers
  const fetchSpeakers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all speakers for the event with pagination
      // Use a reasonable page size (50-100) instead of 1000
      const response = await eventService.getEventSpeakers(EVENT_ID, {
        page_size: 100, // Fetch 100 at a time
        ordering: "-id",
      });

      // Generate consistent colors for avatars
      const colors = ["#2762C7", "#1BB273", "#9333EA", "#F97316", "#DC2626", "#10B981", "#F59E0B", "#8B5CF6"];
      
      // Map backend Speaker format to UI format
      const mappedSpeakers = response.speakers.map((speaker) => {
        const avatarColor = colors[speaker.id % colors.length];
        const roleText = speaker.role && speaker.company
          ? `${speaker.role} at ${speaker.company}`
          : speaker.role || speaker.company || "Speaker";

        return {
          id: speaker.id.toString(),
          name: speaker.full_name || "Speaker",
          role: roleText,
          avatar: speaker.profile_pic ? { uri: speaker.profile_pic } : undefined,
          avatarColor: avatarColor,
          speakerData: speaker, // Store full data for detail screen
        };
      });

      setSpeakers(mappedSpeakers);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load speakers";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSpeakers();
    } catch (err) {
      // Error already handled in fetchSpeakers
    } finally {
      setRefreshing(false);
    }
  }, [fetchSpeakers]);

  // Fetch on mount only (not on every focus to avoid constant reloading)
  useEffect(() => {
    fetchSpeakers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on screen focus only if data is empty or there was an error
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we don't have data and we're not currently loading
      if (speakers.length === 0 && !isLoading) {
        fetchSpeakers();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const removeFilter = (filterId: string) => {
    setSelectedFilterIds(selectedFilterIds.filter((id) => id !== filterId));
  };

  const bottomNavItems = [
    {
      icon: (active: boolean) =>
        active ? (
          <HomeIconFilled size={24} color="#000000" />
        ) : (
          <HomeIcon size={24} color="#A3A3A3" />
        ),
      label: "Home",
      route: "Home",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <PeopleIconFilled size={24} color="#000000" />
        ) : (
          <PeopleIcon size={24} color="#A3A3A3" />
        ),
      label: "Attendees",
      route: "Attendees",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <CalendarIconFilled size={24} color="#000000" />
        ) : (
          <CalendarIcon size={24} color="#A3A3A3" />
        ),
      label: "Schedule",
      route: "Schedule",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <ClockIconFilled size={24} color="#000000" />
        ) : (
          <ClockIcon size={24} color="#A3A3A3" />
        ),
      label: "Meetings",
      route: "Meetings",
      badge: meetingsBadgeCount,
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#000000" />
        ) : (
          <HeartIcon size={24} color="#A3A3A3" />
        ),
      label: "Connections",
      route: "Connections",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        {/* Screen Title Section */}
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3 flex-row items-center"
            hitSlop={10}
          >
            <ChevronLeftIcon size={24} color="#404040" />
            <Text className="text-[30px] pl-1 font-bold text-neutral-900">
              Speakers
            </Text>
          </Pressable>
        </View>

        {/* Filter Section */}
        <View className="px-4 mb-1 rounded-xl">
          <Pressable
            className="flex-row items-center justify-between border border-neutral-300 bg-white rounded-xl px-4 py-1.5"
            onPress={() => setIsFilterModalVisible(true)}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center">
              <FilterIcon size={20} color="#404040" />
              <Text className="text-[16px] font-medium text-neutral-900 ml-1">
                Filter
              </Text>
            </View>
            <ChevronDownIcon size={30} color="#404040" />
          </Pressable>
        </View>

        {/* Active Filter Tags */}
        <View className="px-4 mb-6 rounded-xl">
          {selectedFilterIds.length > 0 && (
            <View className="flex-row flex-wrap mt-3">
              {selectedFilterIds.map((filterId) => (
                <FilterTag
                  key={filterId}
                  label={getFilterLabel(filterId)}
                  onRemove={() => removeFilter(filterId)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Speakers Grid */}
        <View className="px-4">
          {isLoading ? (
            <View className="py-20 items-center">
              <LoadingSpinner size="large" />
              <Text className="text-gray-500 mt-4">Loading speakers...</Text>
            </View>
          ) : error ? (
            <View className="py-20 items-center px-4">
              <Text className="text-red-600 text-center mb-4">{error}</Text>
              <Pressable
                onPress={fetchSpeakers}
                className="bg-black rounded-md px-6 py-3"
              >
                <Text className="text-white font-medium">Retry</Text>
              </Pressable>
            </View>
          ) : speakers.length > 0 ? (
            <View className="flex-row flex-wrap -mx-1.5">
              {speakers.map((speaker) => (
                <View
                  key={speaker.id}
                  className="px-1.5 mb-3"
                  style={{ width: "50%" }}
                >
                  <SpeakerCard
                    name={speaker.name}
                    role={speaker.role}
                    avatar={speaker.avatar}
                    avatarColor={speaker.avatarColor}
                    variant="vertical"
                    onPress={() =>
                      navigation.navigate("SpeakerDetail", {
                        speakerId: speaker.id,
                        name: speaker.name,
                      })
                    }
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-20 items-center">
              <Text className="text-gray-500 text-center">
                No speakers available.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Home"
          onNavigate={(route) => {
            if (route === "Home") {
              navigateRef("Home");
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              navigation.navigate("Schedule");
            } else if (route === "Meetings") {
              navigation.navigate("Meetings");
            } else if (route === "Connections") {
              navigation.navigate("Connections");
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        categories={filterCategories}
        initialSelected={selectedFilterIds}
      />
    </View>
  );
}
