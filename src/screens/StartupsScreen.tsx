import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Platform,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
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
import { eventService, type Company } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import { getStartupDirectoryFilterCategories } from "../constants/industryAndInterests";
import { GROWTH_STAGE_OPTIONS } from "../constants/startupGrowthStages";
import { directoryCompanyMatchesFilters } from "../utils/directoryFilters";
import {
  ensureStartupsDirectory,
  getCachedStartupsDirectory,
  hydrateStartupsDirectoryCache,
  STARTUPS_DIRECTORY_PAGE_SIZE,
} from "../utils/startupsDirectoryCache";

const STARTUP_LOGO_COLORS = [
  "#2762C7",
  "#000000",
  "#FFC107",
  "#E91E63",
  "#DC2626",
  "#9333EA",
  "#10B981",
  "#F97316",
];

type StartupRow = {
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
};

function mapStartupCompany(c: Company): StartupRow {
  const name = c.name || `Startup ${c.id}`;
  const logoColor =
    STARTUP_LOGO_COLORS[name.length % STARTUP_LOGO_COLORS.length];
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
}

export default function StartupsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Startups">>();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { hasUnreadNotifications } = useNotifications();
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const filterCategories: FilterCategory[] = useMemo(
    () =>
      getStartupDirectoryFilterCategories(
        GROWTH_STAGE_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
      ),
    [],
  );

  const initialSnapshotRef = useRef(getCachedStartupsDirectory());
  const [startups, setStartups] = useState<StartupRow[]>(() =>
    (initialSnapshotRef.current?.companies ?? []).map(mapStartupCompany),
  );
  const [isLoading, setIsLoading] = useState(
    initialSnapshotRef.current == null,
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => {
    const initial = initialSnapshotRef.current;
    if (!initial) return false;
    return (
      Boolean(initial.pagination.next) ||
      initial.companies.length < initial.pagination.count
    );
  });
  const [nextPage, setNextPage] = useState(2);
  const requestInFlightRef = useRef(false);
  const hasScheduledPageTwoPrefetchRef = useRef(false);
  const startupListRef = useRef<FlatList<StartupRow>>(null);

  const fetchStartups = useCallback(async ({
    page = 1,
    isRefresh = false,
  }: {
    page?: number;
    isRefresh?: boolean;
  } = {}) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    if (isRefresh) {
      hasScheduledPageTwoPrefetchRef.current = false;
      setRefreshing(true);
    } else if (page === 1) {
      setIsLoading(getCachedStartupsDirectory() == null);
    } else {
      setIsLoadingMore(true);
    }
    if (page === 1) setError(null);

    try {
      if (page === 1 && !isRefresh && getCachedStartupsDirectory() == null) {
        const persisted = await hydrateStartupsDirectoryCache();
        if (persisted) {
          const persistedRows = persisted.companies.map(mapStartupCompany);
          setStartups(persistedRows);
          setHasMore(
            Boolean(persisted.pagination.next) ||
              persistedRows.length < persisted.pagination.count,
          );
          setNextPage(2);
          setIsLoading(false);
        }
      }

      const response =
        page === 1
          ? await ensureStartupsDirectory({ force: isRefresh })
          : await eventService.getDirectoryCompanies(EVENT_ID, "startup", {
              page,
              page_size: STARTUPS_DIRECTORY_PAGE_SIZE,
              ordering: "-id",
            });
      const list: StartupRow[] = response.companies.map(mapStartupCompany);

      setStartups((current) => {
        if (page === 1) return list;
        const byId = new Map(current.map((row) => [row.id, row]));
        list.forEach((row) => byId.set(row.id, row));
        return Array.from(byId.values());
      });

      const loadedThrough =
        (page - 1) * STARTUPS_DIRECTORY_PAGE_SIZE + list.length;
      setHasMore(
        Boolean(response.pagination.next) ||
          loadedThrough < response.pagination.count,
      );
      setNextPage(page + 1);
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err?.message || "Failed to load startups";
      if (page === 1 && getCachedStartupsDirectory() == null) setError(msg);
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchStartups();
  }, [fetchStartups]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || refreshing) return;
    void fetchStartups({ page: nextPage });
  }, [fetchStartups, hasMore, isLoading, isLoadingMore, nextPage, refreshing]);

  useEffect(() => {
    if (
      isLoading ||
      !hasMore ||
      nextPage !== 2 ||
      hasScheduledPageTwoPrefetchRef.current
    ) {
      return;
    }
    hasScheduledPageTwoPrefetchRef.current = true;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(loadMore, 700);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [hasMore, isLoading, loadMore, nextPage]);

  const displayedStartups = useMemo(() => {
    if (selectedFilterIds.length === 0) return startups;
    return startups.filter((row) =>
      directoryCompanyMatchesFilters(selectedFilterIds, filterCategories, row),
    );
  }, [startups, selectedFilterIds, filterCategories]);

  const scrollStartupListToOffset = useCallback((offset: number) => {
    startupListRef.current?.scrollToOffset({ offset, animated: true });
  }, []);

  const companyHighlight = useCompanyDeeplinkHighlight(
    "Startups",
    "startup",
    displayedStartups,
    isLoading,
    scrollStartupListToOffset,
  );

  const renderStartup = useCallback(
    ({ item: startup }: ListRenderItemInfo<StartupRow>) => {
      const highlighted = companyHighlight.isHighlighted(startup.id);
      const tags = [
        startup.country
          ? { label: startup.country, kind: "country" as const }
          : null,
        startup.growth_stage
          ? { label: startup.growth_stage, kind: "growth" as const }
          : null,
        startup.company_sector
          ? { label: startup.company_sector, kind: "industry" as const }
          : null,
        startup.year_founded
          ? { label: startup.year_founded, kind: "year" as const }
          : null,
      ].filter(Boolean) as {
        label: string;
        kind: "country" | "growth" | "industry" | "year";
      }[];

      return (
        <View
          ref={(node) => companyHighlight.bindCell(startup.id, node)}
          onLayout={() => companyHighlight.remeasureCell(startup.id)}
          className="px-1.5 mb-3"
          style={{
            flex: 1,
            maxWidth: "50%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <StartupDirectoryCard
            name={startup.name}
            logo={startup.logo}
            logoColor={startup.logoColor}
            tags={tags}
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
    },
    [companyHighlight, navigation],
  );

  const listHeader = (
    <>
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
                  {" "}({selectedFilterIds.length})
                </Text>
              ) : null}
            </Text>
          </View>
          <ChevronDownIcon size={30} color="#404040" />
        </Pressable>
      </View>
    </>
  );

  const listEmpty = isLoading ? (
    <View className="px-4">
      <SkeletonCardGrid count={6} />
    </View>
  ) : error ? (
    <View className="py-12 px-4 items-center">
      <Text className="text-red-600 text-center">{error}</Text>
      <Pressable
        onPress={() => void fetchStartups()}
        className="mt-3 px-4 py-2 bg-neutral-200 rounded-lg"
      >
        <Text className="text-neutral-900 font-medium">Retry</Text>
      </Pressable>
    </View>
  ) : startups.length === 0 ? (
    <View className="py-12 px-4">
      <Text className="text-neutral-600 text-center">
        No startups available.
      </Text>
    </View>
  ) : (
    <View className="py-12 px-4">
      <Text className="text-neutral-600 text-center">
        No startups match your filters.
      </Text>
    </View>
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

      <FlatList
        ref={startupListRef}
        className="flex-1"
        data={!isLoading && !error ? displayedStartups : []}
        renderItem={renderStartup}
        keyExtractor={(startup) => String(startup.id)}
        numColumns={2}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              className="my-5"
              size="small"
              color="#1BB273"
            />
          ) : null
        }
        columnWrapperStyle={
          displayedStartups.length > 0
            ? { paddingHorizontal: 10 }
            : undefined
        }
        contentContainerStyle={{ paddingBottom: FLOATING_NAV_BOTTOM_INSET }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) =>
          companyHighlight.registerScrollViewport(e.nativeEvent.layout.height)
        }
        refreshing={refreshing}
        onRefresh={() => void fetchStartups({ page: 1, isRefresh: true })}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
      />

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
