import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, Pressable, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useChecklist } from "../context/ChecklistContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  useMeetingsBadgeCount,
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { gradients } from "../theme/theme";
import { eventService } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
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
  BottomNavigation,
} from "../components";
import EventChecklist from "../components/EventChecklist";
import { ArrowUpRightIcon } from "../components/icons";
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

export default function HomeScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const scrollViewRef = useRef<ScrollView>(null);
  const [checklistExpanded, setChecklistExpanded] = useState(true);

  // Get checklist state and methods from context
  const {
    isConnectAttendeesComplete,
    isRequestMeetingComplete,
    isAddSessionsComplete,
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

  // "All completed" = only visible tasks (Connect + Request meeting). addSessions ignored until re-enabled.
  const allVisibleTasksComplete =
    isConnectAttendeesComplete && isRequestMeetingComplete;

  // Auto-collapse checklist when all visible items are completed (once per session)
  useEffect(() => {
    if (allVisibleTasksComplete && checklistExpanded && !hasAutoCollapsed) {
      setTimeout(() => {
        setChecklistExpanded(false);
        setHasAutoCollapsed(true);
      }, 500);
    }
  }, [
    allVisibleTasksComplete,
    checklistExpanded,
    hasAutoCollapsed,
  ]);

  // On Home focus: scroll to top, refresh badge, and if all tasks done keep checklist closed
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      refreshMeetingsBadge();
      if (allVisibleTasksComplete) {
        setChecklistExpanded(false);
      }
    }, [refreshMeetingsBadge, allVisibleTasksComplete])
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

  // Fetch all featured data on mount
  useEffect(() => {
    fetchFeaturedSpeakers();
    fetchFeaturedExhibitors();
    fetchFeaturedPartners();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeaturedSpeakers(),
        fetchFeaturedExhibitors(),
        fetchFeaturedPartners(),
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

  const handleAddSessions = () => {
    navigation.navigate("Schedule");
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
    <View className="flex-1 bg-surface">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onMessagesPress={() => navigation.navigate("Messages")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
        unreadMessagesCount={messagesBadgeCount}
      />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
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
        {/* Event Banners - Horizontal Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 pt-4 pb-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <BannerCard
            // badge="EVENT LIVE IN LAGOS"
            title="Welcome to ATE 2026"
            description="Complete your checklist and start booking 1:1 meetings with attendees and partners."
            buttonText="View attendees"
            gradient={gradients.sparkBlack}
            backgroundImage={require("../assets/images/lhs-card.jpg")}
            onPress={() => navigation.navigate("Attendees")}
          />
          <BannerCard
            // badge="PARTNER OFFERS"
            title="Review event schedule"
            description="Get your ATE 2026 itinerary ready ahead of the event day"
            buttonText="See schedule"
            gradient={gradients.partnerGreen}
            backgroundImage={require("../assets/images/rhs-card.jpg")}
            onPress={() => navigation.navigate("Schedule")}
          />
        </ScrollView>

        {/* Body sections */}
        <View className="px-4">
          {/* Event Checklist Section */}
          <EventChecklist
            title="Event Checklist"
            description="Complete these to get the most out of the event."
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
              description="Book focused 20-minute meetings with people you care about."
              completed={isRequestMeetingComplete}
              onPress={handleRequestMeeting}
            />
            {/* TODO: Re-enable in next update — Add sessions to your schedule */}
            {/* <ChecklistItem
              title="Add sessions to your schedule"
              description="Add sessions so you never miss a talk."
              completed={isAddSessionsComplete}
              onPress={handleAddSessions}
            /> */}
          </EventChecklist>

          {/* Exhibitors Section */}
          <Card
            title="Exhibitors"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {exhibitorsLoading ? (
              <View className="py-8 items-center">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-2">Loading exhibitors...</Text>
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
                          name={exhibitor.organisation || "Exhibitor"}
                          logo={(exhibitor as any).logo}
                          logoColor={logoColor}
                          onPress={() =>
                            navigation.navigate("CompanyDetail", {
                              exhibitorId: exhibitor.id.toString(),
                              type: "exhibitor",
                              name: exhibitor.organisation || "Exhibitor",
                            })
                          }
                        />
                        <Text className="text-xs text-neutral-600 text-center mt-2">
                          {exhibitor.organisation || "Exhibitor"}
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
                    View all Exhibitors
                  </Text>
                  <ArrowUpRightIcon size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500 text-center">
                  No featured exhibitors available.
                </Text>
              </View>
            )}
          </Card>

          {/* Partners Section */}
          <Card
            title="Partners"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {partnersLoading ? (
              <View className="py-8 items-center">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-2">Loading partners...</Text>
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
                          name={partner.organisation || "Partner"}
                          logo={(partner as any).logo ? { uri: (partner as any).logo } : undefined}
                          logoColor={logoColor}
                          onPress={() =>
                            navigation.navigate("CompanyDetail", {
                              exhibitorId: partner.id.toString(),
                              type: "partner",
                              name: partner.organisation || "Partner",
                            })
                          }
                        />
                        <Text className="text-xs text-neutral-600 text-center mt-2">
                          {partner.organisation || "Partner"}
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
                    View all Partners
                  </Text>
                  <ArrowUpRightIcon size={18} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View className="py-4">
                <Text className="text-gray-500 text-center">
                  No featured partners available.
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

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Home"
          onNavigate={(route) => {
            if (route === "Home") {
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
    </View>
  );
}
