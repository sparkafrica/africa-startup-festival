import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useChecklist } from "../context/ChecklistContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { useHomeScroll } from "../context/HomeScrollContext";
import { gradients } from "../theme/theme";
import { eventService } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import { bootstrapEventData } from "../utils/eventDataCache";
import {
  HeaderBar,
  BannerCard,
  Card,
  ChecklistItem,
  ExhibitorCard,
  HomeDirectorySkeleton,
  PartnerCard,
  SpeakerCard,
  SpeakerDetailModal,
  FLOATING_NAV_BOTTOM_INSET,
} from "../components";
import { StartupJoinReminderBanner } from "../components/StartupJoinReminderBanner";
import { useStartupJoin } from "../hooks/useStartupJoin";
import HomePushNotificationOverlay from "../components/HomePushNotificationOverlay";
import EventChecklist from "../components/EventChecklist";
import { ArrowUpRightIcon } from "../components/icons";
// import { ArrowRightIcon } from "../components/icons";
import { getEventFeatures } from "../config/eventFeatures";

type DirectoryTabId = "exhibitors" | "partners" | "startups" | "speakers";

type FeaturedCompany = {
  id: number;
  organisation: string;
  logo?: string | null;
};

const DIRECTORY_TABS: {
  id: DirectoryTabId;
  label: string;
  title: string;
  description: string;
  viewAllLabel: string;
  screen: "Exhibitors" | "Partners" | "Startups" | "Speakers";
  emptyLabel: string;
}[] = [
  {
    id: "exhibitors",
    label: "Exhibitors",
    title: "Exhibitors",
    description: "Tap a logo to view exhibitor profile and booth details.",
    viewAllLabel: "View all exhibitors",
    screen: "Exhibitors",
    emptyLabel: "No featured exhibitors available.",
  },
  {
    id: "partners",
    label: "Partners",
    title: "Partners",
    description: "Tap a logo to view partner profile and partnership details.",
    viewAllLabel: "View all partners",
    screen: "Partners",
    emptyLabel: "No featured partners available.",
  },
  {
    id: "startups",
    label: "Startups",
    title: "Startups",
    description: "Tap a logo to view startup profile, team, and pitch details.",
    viewAllLabel: "View all startups",
    screen: "Startups",
    emptyLabel: "No featured startups available.",
  },
  {
    id: "speakers",
    label: "Speakers",
    title: "Speakers",
    description: "Tap an image to view the full profile of each speaker.",
    viewAllLabel: "View all speakers",
    screen: "Speakers",
    emptyLabel: "No featured speakers available.",
  },
];

const LOGO_COLORS = [
  "#2762C7",
  "#000000",
  "#FFC107",
  "#E91E63",
  "#DC2626",
  "#9333EA",
  "#10B981",
  "#F97316",
];

export default function HomeScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const eventFeatures = getEventFeatures();
  const { registerScrollToTop } = useHomeScroll();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const scrollViewRef = useRef<ScrollView>(null);
  const [checklistExpanded, setChecklistExpanded] = useState(true);

  useEffect(() => {
    return registerScrollToTop(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [registerScrollToTop]);

  // Get checklist state and methods from context
  const {
    isConnectAttendeesComplete,
    isRequestMeetingComplete,
  } = useChecklist();

  // Track if checklist has been auto-collapsed (to prevent re-collapsing on manual opens)
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);

  const { hasUnreadNotifications } = useNotifications();
  const { adminPendingRequests } = useStartupJoin();

  // State for featured data
  const [featuredSpeakers, setFeaturedSpeakers] = useState<any[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [speakersError, setSpeakersError] = useState<string | null>(null);

  const [featuredExhibitors, setFeaturedExhibitors] = useState<FeaturedCompany[]>([]);
  const [exhibitorsLoading, setExhibitorsLoading] = useState(true);
  const [exhibitorsError, setExhibitorsError] = useState<string | null>(null);

  const [featuredPartners, setFeaturedPartners] = useState<FeaturedCompany[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  const [featuredStartups, setFeaturedStartups] = useState<FeaturedCompany[]>([]);
  const [startupsLoading, setStartupsLoading] = useState(true);
  const [startupsError, setStartupsError] = useState<string | null>(null);

  const [directoryTab, setDirectoryTab] = useState<DirectoryTabId>("exhibitors");

  // Speaker detail modal
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // "All completed" = only visible tasks (Connect + Request meeting).
  const allChecklistComplete =
    isConnectAttendeesComplete && isRequestMeetingComplete;

  // Auto-collapse checklist when all visible items are completed (once per session)
  useEffect(() => {
    if (allChecklistComplete && checklistExpanded && !hasAutoCollapsed) {
      setTimeout(() => {
        setChecklistExpanded(false);
        setHasAutoCollapsed(true);
      }, 500);
    }
  }, [allChecklistComplete, checklistExpanded, hasAutoCollapsed]);

  // On Home focus: scroll to top, refresh badge, and if all tasks done keep checklist closed
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      refreshMeetingsBadge();
      if (allChecklistComplete) {
        setChecklistExpanded(false);
      }
    }, [
      refreshMeetingsBadge,
      allChecklistComplete,
    ]),
  );

  // Fetch featured speakers
  const fetchFeaturedSpeakers = async () => {
    setSpeakersLoading(true);
    setSpeakersError(null);
    try {
      const response = await eventService.getEventSpeakers(EVENT_ID, {
        page_size: 4,
        ordering: "-id", // Or whatever ordering makes sense for "featured"
      });
      
      // Take first 4 speakers as featured
      setFeaturedSpeakers(response.speakers.slice(0, 4));
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load featured speakers";
      setSpeakersError(errorMessage);
      // Don't block the screen if speakers fail to load
    } finally {
      setSpeakersLoading(false);
    }
  };

  // Fetch featured exhibitors (from directory)
  const fetchFeaturedExhibitors = async () => {
    setExhibitorsLoading(true);
    setExhibitorsError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "exhibitor", {
        page_size: 4,
        ordering: "-id",
      });
      setFeaturedExhibitors(response.companies.slice(0, 4).map((c) => ({ id: c.id, organisation: c.name, logo: c.logo })));
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load featured exhibitors";
      setExhibitorsError(errorMessage);
    } finally {
      setExhibitorsLoading(false);
    }
  };

  // Fetch featured partners (from directory)
  const fetchFeaturedPartners = async () => {
    setPartnersLoading(true);
    setPartnersError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "partner", {
        page_size: 4,
        ordering: "-id",
      });
      setFeaturedPartners(response.companies.slice(0, 4).map((c) => ({ id: c.id, organisation: c.name, logo: c.logo })));
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load featured partners";
      setPartnersError(errorMessage);
    } finally {
      setPartnersLoading(false);
    }
  };

  // Fetch featured startups (from directory)
  const fetchFeaturedStartups = async () => {
    setStartupsLoading(true);
    setStartupsError(null);
    try {
      const response = await eventService.getDirectoryCompanies(EVENT_ID, "startup", {
        page_size: 4,
        ordering: "-id",
      });
      setFeaturedStartups(
        response.companies
          .slice(0, 4)
          .map((c) => ({ id: c.id, organisation: c.name, logo: c.logo })),
      );
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load featured startups";
      setStartupsError(errorMessage);
    } finally {
      setStartupsLoading(false);
    }
  };

  // Featured home rows + warm programme/speakers for Schedule & speaker modals
  useEffect(() => {
    fetchFeaturedSpeakers();
    fetchFeaturedExhibitors();
    fetchFeaturedPartners();
    fetchFeaturedStartups();
    void bootstrapEventData();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeaturedSpeakers(),
        fetchFeaturedExhibitors(),
        fetchFeaturedPartners(),
        fetchFeaturedStartups(),
        bootstrapEventData({ force: true }),
      ]);
    } catch (err) {
      // Errors already handled in individual fetch functions
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refetch on screen focus only if data is not loaded (cached behavior)
  // Use refs to avoid dependency issues
  useFocusEffect(
    useCallback(() => {
      // Only refetch if data hasn't been loaded yet or if there was an error
      // This prevents constant refetching while allowing refresh on errors
      if (featuredSpeakers.length === 0 && !speakersLoading) {
        fetchFeaturedSpeakers();
      }
      if (featuredExhibitors.length === 0 && !exhibitorsLoading) {
        fetchFeaturedExhibitors();
      }
      if (featuredPartners.length === 0 && !partnersLoading) {
        fetchFeaturedPartners();
      }
      if (featuredStartups.length === 0 && !startupsLoading) {
        fetchFeaturedStartups();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Handler functions for checklist item navigation
  // Items will be marked as completed when actions are performed on those screens
  const handleConnectAttendees = () => {
    navigation.navigate("Attendees");
  };

  const handleRequestMeeting = () => {
    // Navigate to Attendees screen for user to request a meeting
    navigation.navigate("Attendees");
  };

  const renderChecklist = () => (
    <EventChecklist
      title="Event Checklist"
      description="Complete these to get the most out of the festival."
      expanded={checklistExpanded}
      onToggle={() => setChecklistExpanded(!checklistExpanded)}
      className="mb-4"
    >
      <ChecklistItem
        title="Connect with attendees"
        description="Swipe or search attendees that match your goals."
        completed={isConnectAttendeesComplete}
        onPress={handleConnectAttendees}
      />
      <ChecklistItem
        title="Request a meeting"
        description="Book focused meetings with founders, investors, and operators."
        completed={isRequestMeetingComplete}
        onPress={handleRequestMeeting}
      />
    </EventChecklist>
  );

  const renderHeroBanners = () => (
    <>
      {/* <BannerCard
        title="Explore the programme"
        description="Sessions, panels, and keynotes across Africa Startup Festival."
        buttonText="See schedule"
        gradient={gradients.sparkBlack}
        backgroundImage={require("../assets/images/8th-card.jpeg")}
        onPress={() => navigation.navigate("Schedule")}
      /> */}
      {/* <BannerCard
        title="Discover startups"
        description="Browse the startup directory and connect with founders on the floor."
        buttonText="View startups"
        gradient={gradients.partnerGreen}
        backgroundImage={require("../assets/images/9th-card.jpeg")}
        onPress={() => navigation.navigate("Startups")}
      /> */}
      <BannerCard
        title="Welcome to ASF 2026"
        description="Start booking meetings with founders, investors, and operators."
        buttonText="Book meetings"
        gradient={gradients.sparkBlack}
        variant="black"
        backgroundImage={require("../assets/images/1st-card.jpg")}
        onPress={() => navigation.navigate("Attendees")}
      />
      <BannerCard
        title="Connect with our 2026 Startups"
        description="Discover the startups attending ASF 2026 and connect with founders on the floor."
        buttonText="View startups"
        gradient={gradients.sparkWhite}
        variant="white"
        backgroundImage={require("../assets/images/2nd-card.jpg")}
        onPress={() => navigation.navigate("Startups")}
      />
      {/* <BannerCard
        title="Connect with our 2026 Startups"
        description="Discover the startups attending ASF 2026 and connect with founders on the floor."
        buttonText="View startups"
        gradient={gradients.sparkWhite}
        variant="white"
        backgroundImage={require("../assets/images/2nd-card.jpg")}
        onPress={() => navigation.navigate("Startups")}
      /> */}
    </>
  );

  const activeDirectory = DIRECTORY_TABS.find((t) => t.id === directoryTab)!;

  const renderDirectoryCompanyGrid = (
    items: FeaturedCompany[],
    companyType: "exhibitor" | "partner" | "startup",
    fallbackName: string,
  ) => (
    <View className="flex-row flex-wrap -mx-1.5">
      {items.map((item) => {
        const orgName = item.organisation || `${companyType}-${item.id}`;
        const logoColor = LOGO_COLORS[orgName.length % LOGO_COLORS.length];
        const displayName = item.organisation || fallbackName;

        return (
          <View key={item.id} className="px-1.5 mb-2" style={{ width: "50%" }}>
            {companyType === "partner" ? (
              <PartnerCard
                name={displayName}
                logo={item.logo ? { uri: item.logo } : undefined}
                logoColor={logoColor}
                onPress={() =>
                  navigation.navigate("CompanyDetail", {
                    exhibitorId: item.id.toString(),
                    type: "partner",
                    name: displayName,
                  })
                }
              />
            ) : (
              <ExhibitorCard
                name={displayName}
                logo={item.logo ?? undefined}
                logoColor={logoColor}
                onPress={() =>
                  navigation.navigate("CompanyDetail", {
                    exhibitorId: item.id.toString(),
                    type: companyType,
                    name: displayName,
                  })
                }
              />
            )}
            <Text className="text-xs text-neutral-600 text-center mt-2">
              {displayName}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderDirectoryTabContent = () => {
    if (directoryTab === "speakers") {
      if (speakersLoading) return <HomeDirectorySkeleton />;
      if (speakersError) {
        return (
          <View className="py-4">
            <Text className="text-red-600 text-center">{speakersError}</Text>
          </View>
        );
      }
      if (featuredSpeakers.length === 0) {
        return (
          <View className="py-4">
            <Text className="text-gray-500 text-center">{activeDirectory.emptyLabel}</Text>
          </View>
        );
      }
      return (
        <View className="flex-row flex-wrap -mx-1.5">
          {featuredSpeakers.map((speaker) => {
            const avatarColor = LOGO_COLORS[parseInt(String(speaker.id), 10) % LOGO_COLORS.length];
            return (
              <View key={speaker.id} className="px-1.5 mb-3" style={{ width: "100%" }}>
                <SpeakerCard
                  name={speaker.full_name || "Speaker"}
                  role={
                    speaker.role && speaker.company
                      ? `${speaker.role} at ${speaker.company}`
                      : speaker.role || speaker.company || "Speaker"
                  }
                  avatar={speaker.profile_pic ? { uri: speaker.profile_pic } : undefined}
                  avatarColor={avatarColor}
                  variant="horizontal"
                  onPress={() => {
                    setSelectedSpeakerId(speaker.id.toString());
                    setSpeakerModalVisible(true);
                  }}
                />
              </View>
            );
          })}
        </View>
      );
    }

    const tabState = {
      exhibitors: {
        loading: exhibitorsLoading,
        error: exhibitorsError,
        items: featuredExhibitors,
        type: "exhibitor" as const,
        fallback: "Exhibitor",
      },
      partners: {
        loading: partnersLoading,
        error: partnersError,
        items: featuredPartners,
        type: "partner" as const,
        fallback: "Partner",
      },
      startups: {
        loading: startupsLoading,
        error: startupsError,
        items: featuredStartups,
        type: "startup" as const,
        fallback: "Startup",
      },
    }[directoryTab];

    if (tabState.loading) return <HomeDirectorySkeleton />;
    if (tabState.error) {
      return (
        <View className="py-4">
          <Text className="text-red-600 text-center">{tabState.error}</Text>
        </View>
      );
    }
    if (tabState.items.length === 0) {
      return (
        <View className="py-4">
          <Text className="text-gray-500 text-center">{activeDirectory.emptyLabel}</Text>
        </View>
      );
    }
    return renderDirectoryCompanyGrid(
      tabState.items,
      tabState.type,
      tabState.fallback,
    );
  };

  const isActiveDirectoryLoading =
    directoryTab === "speakers"
      ? speakersLoading
      : directoryTab === "exhibitors"
        ? exhibitorsLoading
        : directoryTab === "partners"
          ? partnersLoading
          : startupsLoading;

  return (
    <View className="flex-1 bg-surface">
      <HeaderBar
        onScanPress={() =>
          navigation.navigate("ScanQR", { initialTab: "Scan Ticket" })
        }
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
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: FLOATING_NAV_BOTTOM_INSET }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 pt-3 pb-3"
          contentContainerStyle={{
            paddingRight: 20,
            paddingVertical: 4,
            alignItems: "stretch",
          }}
        >
          {renderHeroBanners()}
        </ScrollView>

        <StartupJoinReminderBanner pendingCount={adminPendingRequests.length} />

        {eventFeatures.showEventDirectoryOnHome ? (
        <View className="px-4">
          {renderChecklist()}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {DIRECTORY_TABS.map((tab) => {
              const active = directoryTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setDirectoryTab(tab.id)}
                  className={`px-4 py-2.5 rounded-full border ${
                    active
                      ? "bg-black border-black"
                      : "bg-white border-neutral-300"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-neutral-700"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Card
            title={activeDirectory.title}
            description={activeDirectory.description}
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {renderDirectoryTabContent()}
            {!isActiveDirectoryLoading ? (
            <Pressable
              onPress={() => navigation.navigate(activeDirectory.screen)}
              className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mt-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text className="text-white font-semibold text-base px-2">
                {activeDirectory.viewAllLabel}
              </Text>
              <ArrowUpRightIcon size={18} color="#FFFFFF" />
            </Pressable>
            ) : null}
          </Card>
        </View>
        ) : null}
      </ScrollView>

      <SpeakerDetailModal
        visible={speakerModalVisible && !!selectedSpeakerId}
        onClose={() => {
          setSpeakerModalVisible(false);
          setSelectedSpeakerId(null);
        }}
        speakerId={selectedSpeakerId || ""}
        name={featuredSpeakers.find((s) => s.id.toString() === selectedSpeakerId)?.full_name}
      />

      <HomePushNotificationOverlay />
    </View>
  );
}
