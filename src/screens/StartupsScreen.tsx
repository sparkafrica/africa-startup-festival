import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, ScrollView, Pressable, Text, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useCompanyDeeplinkHighlight } from "../hooks/useCompanyDeeplinkHighlight";
import ListRowHighlightOverlay from "../components/ListRowHighlightOverlay";
import type { RootStackParamList } from "../navigation/types";
import {
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { useNotifications } from "../context/NotificationsContext";
import {
  HeaderBar,
  StartupDirectoryCard,
  FilterModal,
  SkeletonCardGrid,
  FLOATING_NAV_BOTTOM_INSET,
  type FilterCategory,
} from "../components";
import { ChevronLeftIcon, FilterIcon } from "../components/HeaderIcons";
import { ChevronDownIcon } from "../components/icons";
import { eventService } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import { getIndustryAndInterestFilterCategories } from "../constants/industryAndInterests";
import { directoryCompanyMatchesFilters } from "../utils/directoryFilters";

export default function StartupsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Startups">>();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { hasUnreadNotifications } = useNotifications();
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const filterCategories: FilterCategory[] = useMemo(
    () => getIndustryAndInterestFilterCategories(),
    [],
  );

  const [startups, setStartups] = useState<
    {
      id: number;
      name: string;
      logoColor: string;
      logo?: string;
      country?: string | null;
      company_sector?: string | null;
      company_description?: string | null;
      growth_stage?: string | null;
      year_founded?: string | null;
      metadata?: Record<string, unknown> | null;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = [
    "#2762C7",
    "#000000",
    "#FFC107",
    "#E91E63",
    "#DC2626",
    "#9333EA",
    "#10B981",
    "#F97316",
  ];

  const fetchStartups = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "startup", {
        page_size: 100,
        ordering: "-id",
      });
      const list = response.companies.map((c) => {
        const name = c.name || `Startup ${c.id}`;
        const logoColor = COLORS[name.length % COLORS.length];
        const meta = (c.metadata ?? {}) as Record<string, unknown>;
        const growthStage =
          typeof meta.growth_stage === "string" && meta.growth_stage.trim()
            ? meta.growth_stage.trim()
            : null;
        const yearFounded =
          meta.year_founded != null && String(meta.year_founded).trim()
            ? String(meta.year_founded).trim()
            : null;
        return {
          id: c.id,
          name,
          logoColor,
          logo: c.logo ?? undefined,
          country: c.country ?? null,
          company_sector: c.company_sector ?? null,
          company_description: c.company_description ?? null,
          growth_stage: growthStage,
          year_founded: yearFounded,
          metadata: c.metadata ?? null,
        };
      });
      setStartups(list);
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err?.message || "Failed to load startups";
      setError(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  const displayedStartups = useMemo(() => {
    if (selectedFilterIds.length === 0) return startups;
    return startups.filter((row) =>
      directoryCompanyMatchesFilters(selectedFilterIds, filterCategories, row),
    );
  }, [startups, selectedFilterIds, filterCategories]);

  const companyHighlight = useCompanyDeeplinkHighlight(
    "Startups",
    "startup",
    displayedStartups,
    isLoading,
  );

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
        contentContainerStyle={{ paddingBottom: FLOATING_NAV_BOTTOM_INSET }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) =>
          companyHighlight.registerScrollViewport(e.nativeEvent.layout.height)
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStartups(true)}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <View ref={companyHighlight.bindScrollContent} collapsable={false}>
          <View className="flex-row items-center px-4 pt-2 pb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-3 flex-row items-center"
              hitSlop={10}
            >
              <ChevronLeftIcon size={24} color="#404040" />
              <Text className="text-[30px] pl-1 font-bold text-neutral-900">
                Startups
              </Text>
            </Pressable>
          </View>

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

          <View className="px-4">
            {isLoading ? (
              <SkeletonCardGrid count={6} />
            ) : error ? (
              <View className="py-12 items-center">
                <Text className="text-red-600 text-center">{error}</Text>
                <Pressable
                  onPress={() => fetchStartups()}
                  className="mt-3 px-4 py-2 bg-neutral-200 rounded-lg"
                >
                  <Text className="text-neutral-900 font-medium">Retry</Text>
                </Pressable>
              </View>
            ) : startups.length === 0 ? (
              <View className="py-12">
                <Text className="text-neutral-600 text-center">
                  No startups available.
                </Text>
              </View>
            ) : displayedStartups.length === 0 ? (
              <View className="py-12">
                <Text className="text-neutral-600 text-center">
                  No startups match your filters.
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap -mx-1.5">
                {displayedStartups.map((startup) => {
                  const highlighted = companyHighlight.isHighlighted(startup.id);
                  return (
                    <View
                      key={startup.id}
                      ref={(node) => companyHighlight.bindCell(startup.id, node)}
                      onLayout={() => companyHighlight.remeasureCell(startup.id)}
                      className="px-1.5 mb-3"
                      style={{
                        width: "50%",
                        position: "relative",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <StartupDirectoryCard
                        name={startup.name}
                        logo={startup.logo}
                        logoColor={startup.logoColor}
                        tags={[
                          startup.country,
                          startup.growth_stage,
                          startup.company_sector,
                          startup.year_founded,
                        ].filter(Boolean) as string[]}
                        onPress={() => {
                          companyHighlight.clearHighlight();
                          navigation.navigate("CompanyDetail", {
                            exhibitorId: startup.id.toString(),
                            type: "startup",
                            name: startup.name,
                          });
                        }}
                      />
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

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={setSelectedFilterIds}
        categories={filterCategories}
        initialSelected={selectedFilterIds}
      />
    </View>
  );
}
