import React, { useState } from "react";
import { View, ScrollView, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import {
  HeaderBar,
  SpeakerCard,
  BottomNavigation,
  FilterTag,
  FilterModal,
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
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

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

  // TODO: BACKEND INTEGRATION - Replace mock speaker data with API call
  // API Endpoint: GET /api/speakers
  // Query Params: ?filters={encodedFilters}&page={page}&limit={limit}
  // Response: { speakers: Speaker[], total: number, page: number }
  // TODO: BACKEND - Fetch speakers on component mount and when filters change
  // TODO: BACKEND - Handle pagination/infinite scroll
  // TODO: BACKEND - Cache speakers in state management
  // TODO: BACKEND - Handle loading and error states
  // TODO: Replace with backend data
  const speakers = [
    {
      name: "Ada Okafor",
      role: "VC Partner",
      avatarColor: "#2762C7",
      avatar: { uri: "https://i.pravatar.cc/150?img=5" },
    },
    {
      name: "Michael Chen",
      role: "Founder & CEO",
      avatarColor: "#1BB273",
      avatar: { uri: "https://i.pravatar.cc/150?img=12" },
    },
    {
      name: "Emma Rodriguez",
      role: "Head of Growth",
      avatarColor: "#9333EA",
      avatar: { uri: "https://i.pravatar.cc/150?img=47" },
    },
    {
      name: "Clint 491",
      role: "Head, Flash Drive",
      avatarColor: "#F97316",
      avatar: { uri: "https://i.pravatar.cc/150?img=33" },
    },
    {
      name: "Clint 491",
      role: "Head, Flash Drive",
      avatarColor: "#F97316",
      avatar: { uri: "https://i.pravatar.cc/150?img=33" },
    },
    {
      name: "Emma Rodriguez",
      role: "Head of Growth",
      avatarColor: "#9333EA",
      avatar: { uri: "https://i.pravatar.cc/150?img=47" },
    },
    {
      name: "Michael Chen",
      role: "Founder & CEO",
      avatarColor: "#1BB273",
      avatar: { uri: "https://i.pravatar.cc/150?img=12" },
    },
    {
      name: "Ada Okafor",
      role: "VC Partner",
      avatarColor: "#2762C7",
      avatar: { uri: "https://i.pravatar.cc/150?img=5" },
    },
  ];

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
        hasUnreadNotifications={false}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
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
          <View className="flex-row flex-wrap -mx-1.5">
            {speakers.map((speaker, index) => (
              <View
                key={index}
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
                      speakerId: speaker.name
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                      name: speaker.name,
                    })
                  }
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Home"
          onNavigate={(route) => {
            if (route === "Home") {
              navigation.navigate("Home");
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
