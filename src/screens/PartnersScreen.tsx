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
  PartnerCard,
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

export default function PartnersScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Partners">>();
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

  const [partners, setPartners] = useState<
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

  const fetchPartners = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "partner", {
        page_size: 100,
        ordering: "-id",
      });
      const list = response.companies.map((c) => {
        const name = c.name || `Partner ${c.id}`;
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
      setPartners(list);
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : err?.message || "Failed to load partners";
      setError(msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const displayedPartners = useMemo(() => {
    if (selectedFilterIds.length === 0) return partners;
    return partners.filter((row) =>
      directoryCompanyMatchesFilters(selectedFilterIds, filterCategories, row)
    );
  }, [partners, selectedFilterIds, filterCategories]);

  const companyHighlight = useCompanyDeeplinkHighlight(
    "Partners",
    "partner",
    displayedPartners,
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
            onRefresh={() => fetchPartners(true)}
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
              Partners
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

        {/* Partners Grid */}
        <View className="px-4">
          {isLoading ? (
            <SkeletonCardGrid count={6} />
          ) : error ? (
            <View className="py-12 items-center">
              <Text className="text-red-600 text-center">{error}</Text>
              <Pressable
                onPress={() => fetchPartners()}
                className="mt-3 px-4 py-2 bg-neutral-200 rounded-lg"
              >
                <Text className="text-neutral-900 font-medium">Retry</Text>
              </Pressable>
            </View>
          ) : partners.length === 0 ? (
            <View className="py-12">
              <Text className="text-neutral-600 text-center">No partners available.</Text>
            </View>
          ) : displayedPartners.length === 0 ? (
            <View className="py-12">
              <Text className="text-neutral-600 text-center">
                No partners match your filters.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-1.5">
              {displayedPartners.map((partner) => {
                const highlighted = companyHighlight.isHighlighted(partner.id);
                return (
                  <View
                    key={partner.id}
                    ref={(node) => companyHighlight.bindCell(partner.id, node)}
                    onLayout={() => companyHighlight.remeasureCell(partner.id)}
                    className="px-1.5 mb-3"
                    style={{
                      width: "50%",
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <PartnerCard
                      name={partner.name}
                      logo={partner.logo ? { uri: partner.logo } : undefined}
                      logoColor={partner.logoColor}
                      onPress={() => {
                        companyHighlight.clearHighlight();
                        navigation.navigate("CompanyDetail", {
                          exhibitorId: partner.id.toString(),
                          type: "partner",
                          name: partner.name,
                        });
                      }}
                    />
                    <Text className="text-xs text-neutral-600 text-center mt-2">
                      {partner.name}
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
