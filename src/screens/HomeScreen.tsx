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
  LoadingSpinner,
  PartnerCard,
  SpeakerCard,
  SpeakerDetailModal,
  FLOATING_NAV_BOTTOM_INSET,
} from "../components";
import HomePushNotificationOverlay from "../components/HomePushNotificationOverlay";
import EventChecklist from "../components/EventChecklist";
import { ArrowUpRightIcon } from "../components/icons";
// import { ArrowRightIcon } from "../components/icons";
import {
  checkFetchAndReloadOta,
  OTA_HOME_STABLE_DELAY_MS,
} from "../utils/otaUpdateFlow";
import { getEventFeatures } from "../config/eventFeatures";

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

  // State for featured data
  const [featuredSpeakers, setFeaturedSpeakers] = useState<any[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [speakersError, setSpeakersError] = useState<string | null>(null);

  const [featuredExhibitors, setFeaturedExhibitors] = useState<any[]>([]);
  const [exhibitorsLoading, setExhibitorsLoading] = useState(true);
  const [exhibitorsError, setExhibitorsError] = useState<string | null>(null);

  const [featuredPartners, setFeaturedPartners] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

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

  // Featured home rows + warm programme/speakers for Schedule & speaker modals
  useEffect(() => {
    fetchFeaturedSpeakers();
    fetchFeaturedExhibitors();
    fetchFeaturedPartners();
    void bootstrapEventData();
  }, []);

  // OTA: once Home is mounted and stable, check for a pending JS update,
  // download it in the background, and reload the app to apply.
  // No-ops in dev / Expo Go (see `otaUpdateFlow.ts`).
  useEffect(() => {
    const timer = setTimeout(() => {
      checkFetchAndReloadOta(() => {
        // Silent reload — no UI hint for this rollout.
      }).catch(() => {
        // Swallow OTA failures; user keeps using the current JS bundle.
      });
    }, OTA_HOME_STABLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeaturedSpeakers(),
        fetchFeaturedExhibitors(),
        fetchFeaturedPartners(),
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
      <BannerCard
        title="Explore the programme"
        description="Sessions, panels, and keynotes across Africa Startup Festival."
        buttonText="See schedule"
        gradient={gradients.sparkBlack}
        backgroundImage={require("../assets/images/8th-card.jpeg")}
        onPress={() => navigation.navigate("Schedule")}
      />
      <BannerCard
        title="Discover startups"
        description="Browse the startup directory and connect with founders on the floor."
        buttonText="View startups"
        gradient={gradients.partnerGreen}
        backgroundImage={require("../assets/images/9th-card.jpeg")}
        onPress={() => navigation.navigate("Exhibitors")}
      />
      <BannerCard
        title="Meet investors"
        description="Find investors attending ASF and book focused meetings."
        buttonText="Find investors"
        gradient={gradients.sparkBlack}
        backgroundImage={require("../assets/images/7th-card.jpeg")}
        onPress={() => navigation.navigate("Attendees", { roleFilter: "investor" })}
      />
      <BannerCard
        title="Book meetings"
        description="Schedule time with founders, investors, and operators."
        buttonText="Open meetings"
        gradient={gradients.partnerGreen}
        backgroundImage={require("../assets/images/11th-card.jpeg")}
        onPress={() => navigation.navigate("Meetings")}
      />
    </>
  );

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

        {eventFeatures.showEventDirectoryOnHome ? (
        <View className="px-4">
          {renderChecklist()}

          {/* Startups Section */}
          <Card
            title="Startups"
            description="Tap a logo to view startup profile, team, and pitch details."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {exhibitorsLoading ? (
              <View className="py-8 items-center">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-2">Loading startups...</Text>
              </View>
            ) : exhibitorsError ? (
              <View className="py-4">
                <Text className="text-red-600 text-center">{exhibitorsError}</Text>
              </View>
            ) : featuredExhibitors.length > 0 ? (
              <>
                <View className="flex-row flex-wrap -mx-1.5">
                  {featuredExhibitors.map((exhibitor) => {
                    // Generate consistent color from organisation name or ID
                    const colors = ["#2762C7", "#000000", "#FFC107", "#E91E63", "#DC2626", "#9333EA", "#10B981", "#F97316"];
                    const orgName = exhibitor.organisation || `exhibitor-${exhibitor.id}`;
                    const logoColor = colors[orgName.length % colors.length];
                    
                    return (
                      <View key={exhibitor.id} className="px-1.5 mb-2" style={{ width: "50%" }}>
                        <ExhibitorCard
                          name={exhibitor.organisation || "Startup"}
                          logo={(exhibitor as any).logo}
                          logoColor={logoColor}
                          onPress={() =>
                            navigation.navigate("CompanyDetail", {
                              exhibitorId: exhibitor.id.toString(),
                              type: "exhibitor",
                              name: exhibitor.organisation || "Startup",
                            })
                          }
                        />
                        <Text className="text-xs text-neutral-600 text-center mt-2">
                          {exhibitor.organisation || "Startup"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => navigation.navigate("Exhibitors")}
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
                    View all startups
                  </Text>
                  <ArrowUpRightIcon size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500 text-center">
                  No featured startups available.
                </Text>
              </View>
            )}
          </Card>

          {/* Sponsors Section */}
          <Card
            title="Sponsors"
            description="Tap a logo to view sponsor profile and partnership details."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {partnersLoading ? (
              <View className="py-8 items-center">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-2">Loading sponsors...</Text>
              </View>
            ) : partnersError ? (
              <View className="py-4">
                <Text className="text-red-600 text-center">{partnersError}</Text>
              </View>
            ) : featuredPartners.length > 0 ? (
              <>
                <View className="flex-row flex-wrap -mx-1.5">
                  {featuredPartners.map((partner) => {
                    // Generate consistent color from organisation name or ID
                    const colors = ["#2762C7", "#000000", "#FFC107", "#E91E63", "#DC2626", "#9333EA", "#10B981", "#F97316"];
                    const orgName = partner.organisation || `partner-${partner.id}`;
                    const logoColor = colors[orgName.length % colors.length];
                    
                    return (
                      <View key={partner.id} className="px-1.5 mb-2" style={{ width: "50%" }}>
                        <PartnerCard
                          name={partner.organisation || "Sponsor"}
                          logo={(partner as any).logo ? { uri: (partner as any).logo } : undefined}
                          logoColor={logoColor}
                          onPress={() =>
                            navigation.navigate("CompanyDetail", {
                              exhibitorId: partner.id.toString(),
                              type: "partner",
                              name: partner.organisation || "Sponsor",
                            })
                          }
                        />
                        <Text className="text-xs text-neutral-600 text-center mt-2">
                          {partner.organisation || "Sponsor"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => navigation.navigate("Partners")}
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
                    View all sponsors
                  </Text>
                  <ArrowUpRightIcon size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500 text-center">
                  No featured sponsors available.
                </Text>
              </View>
            )}
          </Card>

          {/* Speakers Section */}
          <Card
            title="Speakers"
            description="Tap an image to view full profile of each speaker."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {speakersLoading ? (
              <View className="py-8 items-center">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-2">Loading speakers...</Text>
              </View>
            ) : speakersError ? (
              <View className="py-4">
                <Text className="text-red-600 text-center">{speakersError}</Text>
              </View>
            ) : featuredSpeakers.length > 0 ? (
              <>
                <View className="flex-row flex-wrap -mx-1.5">
                  {featuredSpeakers.map((speaker) => {
                    // Generate avatar color from speaker ID for consistent colors
                    const colors = ["#2762C7", "#1BB273", "#9333EA", "#F97316", "#DC2626", "#10B981"];
                    const avatarColor = colors[parseInt(speaker.id) % colors.length];
                    
                    return (
                      <View key={speaker.id} className="px-1.5 mb-3" style={{ width: "100%" }}>
                        <SpeakerCard
                          name={speaker.full_name || "Speaker"}
                          role={speaker.role && speaker.company 
                            ? `${speaker.role} at ${speaker.company}`
                            : speaker.role || speaker.company || "Speaker"}
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
                <Pressable
                  onPress={() => navigation.navigate("Speakers")}
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
                    View all Speakers
                  </Text>
                  <ArrowUpRightIcon size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500 text-center">
                  No featured speakers available.
                </Text>
              </View>
            )}
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
