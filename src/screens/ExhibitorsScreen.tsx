import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useCompanyDeeplinkHighlight } from "../hooks/useCompanyDeeplinkHighlight";
import ListRowHighlightOverlay from "../components/ListRowHighlightOverlay";
import type { RootStackParamList } from "../navigation/types";
import { navigate as navigateRef } from "../navigation/navigationRef";
import {
  useMeetingsBadgeCount,
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { useNotifications } from "../context/NotificationsContext";
import {
  HeaderBar,
  ExhibitorCard,
  BottomNavigation,
  FilterModal,
  LoadingSpinner,
  type FilterCategory,
} from "../components";
import { ChevronLeftIcon, FilterIcon } from "../components/HeaderIcons";
import { ChevronDownIcon } from "../components/icons";
import { eventService } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import { getIndustryAndInterestFilterCategories } from "../constants/industryAndInterests";
import { directoryCompanyMatchesFilters } from "../utils/directoryFilters";
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

export default function ExhibitorsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Exhibitors">>();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { hasUnreadNotifications } = useNotifications();
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const filterCategories: FilterCategory[] = useMemo(
    () => getIndustryAndInterestFilterCategories(),
    []
  );

  const handleApplyFilters = (filterIds: string[]) => {
    setSelectedFilterIds(filterIds);
  };

  const [exhibitors, setExhibitors] = useState<
    {
      id: number;
      name: string;
      logoColor: string;
      logo?: string;
      company_sector?: string | null;
      company_description?: string | null;
      metadata?: Record<string, unknown> | null;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = ["#2762C7", "#000000", "#FFC107", "#E91E63", "#DC2626", "#9333EA", "#10B981", "#F97316"];

  const fetchExhibitors = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "exhibitor", {
        page_size: 100,
        ordering: "-id",
      });
      const list = response.companies.map((c) => {
        const name = c.name || `Exhibitor ${c.id}`;
        const logoColor = COLORS[name.length % COLORS.length];
        return {
          id: c.id,
          name,
          logoColor,
          logo: c.logo ?? undefined,
          company_sector: c.company_sector ?? null,
          company_description: c.company_description ?? null,
          metadata: c.metadata ?? null,
        };
      });
      setExhibitors(list);
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : err?.message || "Failed to load exhibitors";
      setError(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExhibitors();
  }, [fetchExhibitors]);

  const displayedExhibitors = useMemo(() => {
    if (selectedFilterIds.length === 0) return exhibitors;
    return exhibitors.filter((row) =>
      directoryCompanyMatchesFilters(
        selectedFilterIds,
        filterCategories,
        row
      )
    );
  }, [exhibitors, selectedFilterIds, filterCategories]);

  const companyHighlight = useCompanyDeeplinkHighlight(
    "Exhibitors",
    "exhibitor",
    displayedExhibitors,
    isLoading,
  );

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
        onMyTicketPress={() =>
          navigation.navigate("ScanQR", {
            initialTab: "My Ticket",
            openPersonalTicketQr: true,
          })
        }
        onMessagesPress={() => navigation.navigate("Messages")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
        unreadMessagesCount={messagesBadgeCount}
      />

      <ScrollView
        ref={companyHighlight.scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) =>
          companyHighlight.registerScrollViewport(e.nativeEvent.layout.height)
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchExhibitors(true)}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <View ref={companyHighlight.bindScrollContent} collapsable={false}>
        {/* Screen Title Section */}
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3  flex-row items-center"
            hitSlop={10}
          >
            <ChevronLeftIcon size={24} color="#404040" />
            <Text className="text-[30px] pl-1 font-bold text-neutral-900">
              Exhibitors
            </Text>
          </Pressable>
        </View>

        {/* Filter Section — selections only in modal (no chip row) */}
        <View className="px-4 mb-4 rounded-xl">
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
            <View className="flex-row items-center flex-1">
              <FilterIcon size={20} color="#404040" />
              <Text className="text-[16px] font-medium text-neutral-900 ml-1">
                Filter
                {selectedFilterIds.length > 0 ? (
                  <Text className="text-[16px] font-medium text-[#000000]">
                    {" "}
                    ({selectedFilterIds.length})
                  </Text>
                ) : null}
              </Text>
            </View>
            <ChevronDownIcon size={30} color="#404040" />
          </Pressable>
        </View>

        {/* Exhibitors Grid */}
        <View className="px-4">
          {isLoading ? (
            <View className="py-12 items-center">
              <LoadingSpinner size="large" />
              <Text className="text-neutral-600 mt-3">Loading exhibitors...</Text>
            </View>
          ) : error ? (
            <View className="py-12 items-center">
              <Text className="text-red-600 text-center">{error}</Text>
              <Pressable
                onPress={() => fetchExhibitors()}
                className="mt-3 px-4 py-2 bg-neutral-200 rounded-lg"
              >
                <Text className="text-neutral-900 font-medium">Retry</Text>
              </Pressable>
            </View>
          ) : exhibitors.length === 0 ? (
            <View className="py-12">
              <Text className="text-neutral-600 text-center">No exhibitors available.</Text>
            </View>
          ) : displayedExhibitors.length === 0 ? (
            <View className="py-12">
              <Text className="text-neutral-600 text-center">
                No exhibitors match your filters.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-1.5">
              {displayedExhibitors.map((exhibitor) => {
                const highlighted = companyHighlight.isHighlighted(exhibitor.id);
                return (
                  <View
                    key={exhibitor.id}
                    ref={(node) => companyHighlight.bindCell(exhibitor.id, node)}
                    onLayout={() => companyHighlight.remeasureCell(exhibitor.id)}
                    className="px-1.5 mb-3"
                    style={{
                      width: "50%",
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <ExhibitorCard
                      name={exhibitor.name}
                      logo={exhibitor.logo}
                      logoColor={exhibitor.logoColor}
                      onPress={() => {
                        companyHighlight.clearHighlight();
                        navigation.navigate("CompanyDetail", {
                          exhibitorId: exhibitor.id.toString(),
                          type: "exhibitor",
                          name: exhibitor.name,
                        });
                      }}
                    />
                    <Text className="text-xs text-neutral-600 text-center mt-2">
                      {exhibitor.name}
                    </Text>
                    <ListRowHighlightOverlay
                      visible={highlighted}
                      opacity={companyHighlight.highlightOpacity}
                    />
                  </View>
                );
              })}
            </View>
          )}
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
