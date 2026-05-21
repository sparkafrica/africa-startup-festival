import React, { useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Text,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  EventCard,
  DropdownButton,
  TimeZoneAlertBanner,
  FilterModal,
  LoadingSpinner,
  EventViewModal,
  LeaveFeedbackModal,
  FeedbackSentModal,
  ScheduleSuccessToast,
  SpeakerDetailModal,
  TabButton,
  type FilterCategory,
  type Speaker,
} from "../components";
import Toast from "../components/Toast";
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
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { navigate as navigateRef } from "../navigation/navigationRef";
import { useChecklist } from "../context/ChecklistContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  useMeetingsBadgeCount,
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { eventService, type EventSchedule, type PersonalSchedule } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import {
  SCHEDULE_MOCK_PREVIEW_ENABLED,
  SCHEDULE_SESSION_CTAS_ENABLED,
} from "../config/scheduleFeatures";
import { ApiClientError } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  DAY_FILTER_ID_TO_ISO_DATE,
  deriveDayLabel,
  filterEventSchedules,
  scheduleStartDateIso,
  scheduleVenue,
  setExpoEventDates,
} from "../utils/scheduleFilters";
import {
  clearCachedEventSchedules,
  clearCachedEventSpeakers,
  ensureEventProgramme,
  ensureEventSpeakers,
  getCachedEventSchedules,
  getCachedEventSpeakers,
  isProgrammeCacheFresh,
} from "../utils/eventDataCache";
import {
  isEmbeddedScheduleSpeaker,
  mapCachedApiSpeakerToUi,
  mapEmbeddedSpeakerToUi,
  parseScheduleSpeakersRaw,
} from "../utils/scheduleSpeakers";
import type { Speaker as ApiSpeaker } from "../services/eventService";

/**
 * Reference EventData for schedule cards/modals (not loaded into the live list).
 * Live rows come from mapEventScheduleToEventData + API.
 */
export const MOCK_SCHEDULE_EVENT = {
  id: "mock-1",
  eventScheduleId: 0,
  title: "Opening Keynote: The Future of African Tech",
  stage: "Main Stage",
  day: "Day 1",
  startTime: "10:00 AM",
  endTime: "11:00 AM",
  startTimeMs: Date.parse("2026-06-26T10:00:00"),
  scheduleDateIso: "2026-06-26",
  sponsoredBy: {
    name: "Spark Capital",
    color: "blue" as const,
  },
  speakers: [
    {
      id: "1",
      name: "Dr. Jane Smith",
      affiliation: "VC Partner · TechVentures Inc",
      bio: "Dr. Jane Smith is a seasoned venture capitalist with over 15 years of experience in technology investments.",
      interests: ["Fintech", "Enterprise SaaS", "AI/ML", "Startup Ecosystem"],
      tags: ["VC", "Fintech Expert", "Africa Tech"],
      socialLabel: "jane.smith@techventures.com",
    },
  ] as Speaker[],
  description:
    "Explore how AI is transforming enterprise operations and what's next.",
};

// ============================================================================
// EXTERNAL LINKS INTEGRATION POINTS - ScheduleScreen
// ============================================================================
// This screen handles external links in the following areas:
//
// 1. "ASK A QUESTION" BUTTON
//    - Location: EventCard component & EventViewModal component
//    - Action: Click button → Open external question form URL
//    - Implementation: handleAskQuestion() uses Linking.openURL(QUESTION_FORM_URL)
//    - URL Source Options:
//      a) From event metadata: schedule.metadata.questionUrl
//      b) From event config: event.metadata.questionUrl
//      c) From global config: QUESTION_FORM_URL constant
//    - Status: ✅ Implemented, ready for backend URL integration
//
// 2. "LEAVE FEEDBACK" BUTTON
//    - Location: EventCard component & EventViewModal component
//    - Action: Click button → Open external feedback form URL
//    - Implementation: handleLeaveFeedback() uses Linking.openURL(FEEDBACK_FORM_URL)
//    - URL Source Options:
//      a) From event metadata: schedule.metadata.feedbackUrl
//      b) From event config: event.metadata.feedbackUrl
//      c) From global config: FEEDBACK_FORM_URL constant
//    - Status: ✅ Implemented, ready for backend URL integration
//
// 3. LINKEDIN PROFILE LINKS (Future)
//    - Location: EventViewModal → Speaker cards (if speakers have LinkedIn)
//    - Action: Click speaker LinkedIn → Open speaker's LinkedIn profile
//    - Implementation: Would use Linking.openURL() with speaker.linkedInUrl
//    - Status: ⚠️ Not yet implemented (waiting for backend speaker data with LinkedIn URLs)
//
// ============================================================================

const HIGHLIGHT_PULSE_MS = 2000;
const HIGHLIGHT_FADE_MS = 350;
const ESTIMATED_EVENT_CARD_HEIGHT = 150;

export default function ScheduleScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Schedule">>();
  const route = useRoute<RouteProp<RootStackParamList, "Schedule">>();
  const scrollRef = React.useRef<ScrollView>(null);
  const listContentRef = React.useRef<View>(null);
  const scrollViewportHeightRef = React.useRef(
    Dimensions.get("window").height * 0.55,
  );
  const cardLayoutRef = React.useRef<
    Map<number, { y: number; height: number }>
  >(new Map());
  const cardViewRefs = React.useRef<Map<number, View>>(new Map());
  const highlightRunIdRef = React.useRef(0);
  const highlightTimersRef = React.useRef<{
    scroll?: ReturnType<typeof setTimeout>;
    fade?: ReturnType<typeof setTimeout>;
  }>({});
  const highlightOpacity = React.useRef(new Animated.Value(0)).current;
  const [pulseScheduleId, setPulseScheduleId] = React.useState<number | null>(
    null,
  );
  /** Set once from navigation params; scroll/highlight runs when events list is ready. */
  const [highlightTargetId, setHighlightTargetId] = React.useState<
    number | null
  >(null);

  const clearHighlightTimers = React.useCallback(() => {
    const timers = highlightTimersRef.current;
    if (timers.scroll) clearTimeout(timers.scroll);
    if (timers.fade) clearTimeout(timers.fade);
    highlightTimersRef.current = {};
  }, []);

  const clearScheduleHighlight = React.useCallback(() => {
    clearHighlightTimers();
    highlightRunIdRef.current += 1;
    setHighlightTargetId(null);
    highlightOpacity.stopAnimation();
    highlightOpacity.setValue(0);
    setPulseScheduleId(null);
  }, [clearHighlightTimers, highlightOpacity]);

  const startScheduleHighlight = React.useCallback(
    (scheduleId: number) => {
      clearHighlightTimers();
      const runId = ++highlightRunIdRef.current;
      setPulseScheduleId(scheduleId);
      highlightOpacity.setValue(1);

      highlightTimersRef.current.fade = setTimeout(() => {
        if (highlightRunIdRef.current !== runId) return;
        Animated.timing(highlightOpacity, {
          toValue: 0,
          duration: HIGHLIGHT_FADE_MS,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished && highlightRunIdRef.current === runId) {
            setPulseScheduleId(null);
          }
        });
      }, HIGHLIGHT_PULSE_MS);
    },
    [clearHighlightTimers, highlightOpacity],
  );

  const scrollToCenteredSchedule = React.useCallback((scheduleId: number) => {
    const layout = cardLayoutRef.current.get(scheduleId);
    const viewportH = scrollViewportHeightRef.current;
    if (!layout || !scrollRef.current) return false;

    const centeredY = Math.max(
      0,
      layout.y + layout.height / 2 - viewportH / 2,
    );
    scrollRef.current.scrollTo({ y: centeredY, animated: true });
    return true;
  }, []);

  const measureCardLayout = React.useCallback(
    (scheduleId: number, node: View | null) => {
      const container = listContentRef.current;
      if (!node || !container) return;
      node.measureLayout(
        container,
        (_x, y, _w, height) => {
          cardLayoutRef.current.set(scheduleId, { y, height });
        },
        () => {},
      );
    },
    [],
  );

  const tryScrollAndHighlight = React.useCallback(
    (scheduleId: number, listIndex: number, attempt = 0) => {
      let scrolled = scrollToCenteredSchedule(scheduleId);
      if (!scrolled && listIndex >= 0 && attempt >= 4) {
        const viewportH = scrollViewportHeightRef.current;
        const y = Math.max(
          0,
          listIndex * ESTIMATED_EVENT_CARD_HEIGHT +
            ESTIMATED_EVENT_CARD_HEIGHT / 2 -
            viewportH / 2,
        );
        scrollRef.current?.scrollTo({ y, animated: true });
        scrolled = true;
      }

      if (!scrolled && attempt < 16) {
        highlightTimersRef.current.scroll = setTimeout(
          () => tryScrollAndHighlight(scheduleId, listIndex, attempt + 1),
          80,
        );
        return;
      }

      startScheduleHighlight(scheduleId);
    },
    [scrollToCenteredSchedule, startScheduleHighlight],
  );
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { hasUnreadNotifications } = useNotifications();
  const [scheduleView, setScheduleView] = React.useState<"all" | "my">("all");
  const [selectedStage, setSelectedStage] =
    React.useState<string>("main-stage");
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  interface EventData {
    id: string;
    eventScheduleId: number; // Backend schedule id for addEventToSchedule
    title: string;
    stage: string;
    day: string;
    startTime: string;
    endTime: string;
    sponsoredBy?: { name: string; color: "blue" | "purple" };
    speakers?: Speaker[];
    description?: string;
    personalScheduleId?: number; // For My Schedule tab: backend personal schedule id (remove from schedule)
    /** UTC ms from schedule.start_time — used for chronological sort */
    startTimeMs: number;
    /** YYYY-MM-DD from schedule.start_time — used for day filter matching */
    scheduleDateIso: string;
  }

  const sortEventsByStartTime = (list: EventData[]): EventData[] =>
    [...list].sort((a, b) => a.startTimeMs - b.startTimeMs);

  const [selectedEvent, setSelectedEvent] = React.useState<EventData | null>(
    null
  );
  const [isEventViewModalVisible, setIsEventViewModalVisible] =
    React.useState(false);
  const [isLeaveFeedbackModalVisible, setIsLeaveFeedbackModalVisible] =
    React.useState(false);
  const [isFeedbackSentModalVisible, setIsFeedbackSentModalVisible] =
    React.useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = React.useState<string | null>(null);
  const [selectedSpeakerName, setSelectedSpeakerName] = React.useState<string | undefined>();
  const [speakerModalVisible, setSpeakerModalVisible] = React.useState(false);

  // Add / remove schedule: same non-modal toast as ScheduleSuccessToast (avoids iOS Modal + sheet jank)
  const [scheduleToastVisible, setScheduleToastVisible] = React.useState(false);
  const [scheduleToastTitle, setScheduleToastTitle] = React.useState("");
  const [scheduleToastVariant, setScheduleToastVariant] = React.useState<
    "added" | "removed"
  >("added");

  const { toast, showToast, hideToast } = useToast();

  // State for API data
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [mySchedules, setMySchedules] = React.useState<EventData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [myScheduleLoading, setMyScheduleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [addingScheduleId, setAddingScheduleId] = React.useState<number | null>(
    null,
  );
  const allSchedulesRef = React.useRef<EventSchedule[]>([]);
  const speakerCacheRef = React.useRef<Map<number, ApiSpeaker>>(new Map());

  // ============================================================================
  // EXTERNAL LINKS CONFIGURATION
  // ============================================================================
  // These URLs will be used for external link buttons in the ScheduleScreen.
  // Integration points:
  // 1. "Ask a question" button (EventCard & EventViewModal) → QUESTION_FORM_URL
  // 2. "Leave feedback" button (EventCard & EventViewModal) → FEEDBACK_FORM_URL
  //
  // TODO: Backend Integration Options:
  // - Option A: Store URLs in event metadata (schedule.metadata.questionUrl, schedule.metadata.feedbackUrl)
  // - Option B: Store URLs in event config (event.metadata.questionUrl, event.metadata.feedbackUrl)
  // - Option C: Use global config/env variables for default URLs
  // - Option D: Fetch from dedicated API endpoint (e.g., GET /events/{id}/links/)
  //
  // Current implementation: Uses placeholder URLs, will be replaced with backend data
  // ============================================================================
  const QUESTION_FORM_URL = "https://example.com/ask-question"; // TODO: Replace with backend URL
  const FEEDBACK_FORM_URL = "https://example.com/leave-feedback"; // TODO: Replace with backend URL

  const stageMapping: Record<string, string> = {
    "main-stage": "Main Stage",
    "enterprise-stage": "Enterprise Stage",
  };
  const seedSpeakerCacheFromSchedules = React.useCallback(
    (schedules: EventSchedule[]) => {
      for (const schedule of schedules) {
        for (const item of parseScheduleSpeakersRaw(schedule.speakers)) {
          if (isEmbeddedScheduleSpeaker(item)) {
            speakerCacheRef.current.set(item.id, item as ApiSpeaker);
          }
        }
      }
    },
    [],
  );

  const seedSpeakerCacheRef = React.useCallback(() => {
    const speakers = getCachedEventSpeakers();
    speakers?.forEach((speaker) => {
      if (speaker?.id) {
        speakerCacheRef.current.set(speaker.id, speaker);
      }
    });
  }, []);

  const fetchAndCacheSpeakers = React.useCallback(async () => {
    try {
      const speakers = await ensureEventSpeakers();
      speakers.forEach((speaker) => {
        if (speaker?.id) {
          speakerCacheRef.current.set(speaker.id, speaker);
        }
      });
    } catch {
      // Schedules still render without speaker enrichment
    }
  }, []);

  /**
   * Map EventSchedule (backend) to EventData (UI format)
   */
  const mapEventScheduleToEventData = (schedule: EventSchedule): EventData => {
    // Parse start_time and end_time (ISO 8601 format)
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);

    // Format time as "10:00 AM"
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, "0");
      return `${hour12}:${minutesStr} ${period}`;
    };

    const eventObj = typeof schedule.event === "object" ? schedule.event : null;
    const stage = scheduleVenue(schedule);
    
    // Extract sponsoredBy from metadata if available
    const sponsoredBy = schedule.metadata?.sponsoredBy || eventObj?.metadata?.sponsoredBy;

    const parsed = parseScheduleSpeakersRaw(schedule.speakers);
    const speakers: Speaker[] = parsed
      .map((item) => {
        if (isEmbeddedScheduleSpeaker(item)) {
          return mapEmbeddedSpeakerToUi(item);
        }
        if (typeof item === "number") {
          const cached = speakerCacheRef.current.get(item);
          if (cached) return mapCachedApiSpeakerToUi(cached);
        }
        return null;
      })
      .filter((speaker): speaker is Speaker => speaker !== null);


    return {
      id: `schedule-${schedule.id}`,
      eventScheduleId: schedule.id,
      title: schedule.name,
      stage: stage,
      day: deriveDayLabel(schedule.start_time, schedule.event),
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      startTimeMs: startDate.getTime(),
      scheduleDateIso: scheduleStartDateIso(schedule.start_time),
      sponsoredBy: sponsoredBy ? {
        name: sponsoredBy.name || "",
        color: (sponsoredBy.color || "blue") as "blue" | "purple",
      } : undefined,
      speakers: speakers,
      description: schedule.description || (typeof schedule.event === "object" ? schedule.event.description : undefined),
    };
  };

  const buildEventsFromSchedules = React.useCallback(
    (schedules: EventSchedule[]): EventData[] => {
      const selectedVenue = stageMapping[selectedStage] || "Main Stage";
      const filtered = filterEventSchedules(schedules, {
        venue: selectedVenue,
        dayFilterIds: selectedFilters,
      });
      let mappedEvents = sortEventsByStartTime(
        filtered.map(mapEventScheduleToEventData),
      );

      const showMockPreview =
        SCHEDULE_MOCK_PREVIEW_ENABLED &&
        selectedVenue === "Main Stage" &&
        (selectedFilters.length === 0 ||
          selectedFilters.includes("26th June, 2026"));

      return showMockPreview
        ? [MOCK_SCHEDULE_EVENT, ...mappedEvents]
        : mappedEvents;
    },
    [selectedStage, selectedFilters],
  );

  const applyCachedSchedulesToList = React.useCallback(
    (schedules: EventSchedule[]) => {
      allSchedulesRef.current = schedules;
      seedSpeakerCacheFromSchedules(schedules);
      setEvents(buildEventsFromSchedules(schedules));
    },
    [buildEventsFromSchedules, seedSpeakerCacheFromSchedules],
  );

  /**
   * Load programme from cache or API. Filters/stage only re-slice cached data.
   */
  const fetchEventSchedules = React.useCallback(
    async (options?: { force?: boolean; showLoading?: boolean }) => {
      const force = options?.force ?? false;
      const showLoading = options?.showLoading ?? true;

      if (!force && isProgrammeCacheFresh()) {
        const cached = getCachedEventSchedules();
        if (cached && cached.length > 0) {
          seedSpeakerCacheRef();
          applyCachedSchedulesToList(cached);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      try {
        if (showLoading) setIsLoading(true);
        setError(null);

        seedSpeakerCacheRef();
        await fetchAndCacheSpeakers();
        const schedules = await ensureEventProgramme({ force });
        applyCachedSchedulesToList(schedules);
      } catch (err: any) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load event schedule";
        setError(errorMessage);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [applyCachedSchedulesToList, fetchAndCacheSpeakers, seedSpeakerCacheRef],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      speakerCacheRef.current.clear();
      clearCachedEventSchedules();
      clearCachedEventSpeakers();
      await fetchEventSchedules({ force: true, showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }, [fetchEventSchedules]);

  React.useEffect(() => {
    void fetchEventSchedules({ force: false, showLoading: true });
  }, [fetchEventSchedules]);

  React.useEffect(() => {
    if (allSchedulesRef.current.length === 0) return;
    setEvents(buildEventsFromSchedules(allSchedulesRef.current));
  }, [selectedStage, selectedFilters, buildEventsFromSchedules]);

  useFocusEffect(
    React.useCallback(() => {
      return () => clearScheduleHighlight();
    }, [clearScheduleHighlight]),
  );

  useFocusEffect(
    React.useCallback(() => {
      if (isProgrammeCacheFresh()) return;
      void fetchEventSchedules({
        force: false,
        showLoading: events.length === 0,
      });
    }, [events.length, fetchEventSchedules]),
  );

  React.useEffect(() => {
    const scheduleId = route.params?.highlightScheduleId;
    const highlightStage = route.params?.highlightStage;
    if (scheduleId == null) return;

    if (highlightStage) {
      setSelectedStage(highlightStage);
    }
    setSelectedFilters([]);
    setScheduleView("all");
    cardLayoutRef.current.clear();
    cardViewRefs.current.clear();
    setHighlightTargetId(scheduleId);

    navigation.setParams({
      highlightScheduleId: undefined,
      highlightStage: undefined,
    });
  }, [route.params?.highlightScheduleId, route.params?.highlightStage, navigation]);

  React.useEffect(() => {
    const targetId = highlightTargetId;
    if (targetId == null || scheduleView !== "all" || isLoading) return;

    const index = events.findIndex((e) => e.eventScheduleId === targetId);
    if (index < 0) return;

    clearHighlightTimers();
    const capturedId = targetId;
    highlightTimersRef.current.scroll = setTimeout(() => {
      setHighlightTargetId(null);
      tryScrollAndHighlight(capturedId, index);
    }, 300);

    return () => {
      if (highlightTimersRef.current.scroll) {
        clearTimeout(highlightTimersRef.current.scroll);
      }
    };
  }, [
    highlightTargetId,
    events,
    isLoading,
    scheduleView,
    tryScrollAndHighlight,
    clearHighlightTimers,
  ]);

  const refreshMyScheduleRef = React.useRef<(() => void) | null>(null);

  const fetchMySchedules = React.useCallback(async () => {
    try {
      setMyScheduleLoading(true);
      await fetchAndCacheSpeakers(); // Populate speaker cache for mapping
      const response = await eventService.getPersonalSchedules(EVENT_ID);
      const mapped = response.schedules
        .filter((ps: PersonalSchedule) => ps.event_schedule && typeof ps.event_schedule === "object")
        .map((ps: PersonalSchedule) => {
          const eventData = mapEventScheduleToEventData(ps.event_schedule as EventSchedule);
          return { ...eventData, personalScheduleId: ps.id };
        });
      setMySchedules(sortEventsByStartTime(mapped));
    } catch (err: any) {
      setMySchedules([]);
    } finally {
      setMyScheduleLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshMyScheduleRef.current = fetchMySchedules;
    return () => {
      refreshMyScheduleRef.current = null;
    };
  }, [fetchMySchedules]);

  useFocusEffect(
    useCallback(() => {
      refreshMeetingsBadge();
      if (SCHEDULE_SESSION_CTAS_ENABLED) {
        fetchMySchedules();
      }
    }, [refreshMeetingsBadge, fetchMySchedules])
  );

  React.useEffect(() => {
    if (!SCHEDULE_SESSION_CTAS_ENABLED && scheduleView === "my") {
      setScheduleView("all");
    }
  }, [scheduleView]);

  React.useEffect(() => {
    if (SCHEDULE_SESSION_CTAS_ENABLED && scheduleView === "my") {
      fetchMySchedules();
    }
  }, [scheduleView, fetchMySchedules]);

  const addedScheduleIds = React.useMemo(
    () => new Set(mySchedules.map((m) => m.eventScheduleId)),
    [mySchedules]
  );

  // Filter My Schedule by stage and day (same controls as Schedule tab)
  const filteredMySchedules = React.useMemo(() => {
    const venue = stageMapping[selectedStage] || "Main Stage";
    let list = mySchedules.filter((event) => event.stage === venue);
    if (selectedFilters.length > 0) {
      const allowedDates = new Set(
        selectedFilters
          .map((id) => DAY_FILTER_ID_TO_ISO_DATE[id])
          .filter(Boolean),
      );
      if (allowedDates.size > 0) {
        list = list.filter(
          (event) =>
            event.scheduleDateIso && allowedDates.has(event.scheduleDateIso),
        );
      }
    }
    return sortEventsByStartTime(list);
  }, [mySchedules, selectedStage, selectedFilters]);

  const handleRemoveFromSchedule = async (event?: EventData) => {
    if (!event?.personalScheduleId) return;
    try {
      await eventService.removeEventFromSchedule(event.personalScheduleId);
      setScheduleToastTitle(event.title);
      setScheduleToastVariant("removed");
      setScheduleToastVisible(true);
      await fetchMySchedules();
      if (selectedEvent?.personalScheduleId === event.personalScheduleId) {
        setIsEventViewModalVisible(false);
        setSelectedEvent(null);
      }
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to remove from schedule. Please try again.";
      showToast(msg, "error");
    }
  };

  const hideScheduleToast = React.useCallback(() => {
    setScheduleToastVisible(false);
  }, []);

  const handleAddToSchedule = async (event?: EventData) => {
    if (!event?.eventScheduleId || event.eventScheduleId === 0) return;
    if (addingScheduleId !== null) return;

    setAddingScheduleId(event.eventScheduleId);
    try {
      await eventService.addEventToSchedule(event.eventScheduleId);
      setAddingScheduleId(null);
      setScheduleToastTitle(event.title);
      setScheduleToastVariant("added");
      setScheduleToastVisible(true);
      refreshMyScheduleRef.current?.();
    } catch (err: any) {
      setAddingScheduleId(null);
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to add to schedule. Please try again.";
      showToast(msg, "error");
    }
  };

  const handleLeaveFeedback = async (event?: EventData) => {
    try {
      // Use event-specific feedback URL if available in metadata, otherwise use default
      const feedbackUrl = event?.description?.includes("feedback")
        ? event.description
        : FEEDBACK_FORM_URL;
      
      const canOpen = await Linking.canOpenURL(feedbackUrl);
      if (canOpen) {
        await Linking.openURL(feedbackUrl);
      } else {
        Alert.alert("Error", "Cannot open the feedback form URL");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error opening feedback form URL:", error);
      }
      Alert.alert("Error", "Failed to open feedback form");
    }
  };

  const stageOptions = [
    { label: "Main Stage", value: "main-stage" },
    { label: "Enterprise Stage", value: "enterprise-stage" },
    // { label: "Future Stage", value: "future-stage" },
    // { label: "Mentor Hours", value: "mentor-hours" },
    // { label: "City Circle", value: "city-circle" },
  ];

  const filterCategories: FilterCategory[] = [
    {
      id: "days",
      title: "Days",
      options: [
        { id: "26th June, 2026", label: "26th June, 2026" },
        { id: "27th June, 2026", label: "27th June, 2026" },
      ],
    },
  ];

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

      {/* Fixed Header Section */}
      <View>
        {/* Time Zone Alert Banner */}
        <TimeZoneAlertBanner />

        {/* Schedule / My Schedule segment (My Schedule hidden while CTAs disabled) */}
        {SCHEDULE_SESSION_CTAS_ENABLED ? (
        <View className="flex-row mx-4 mb-2 p-1 bg-neutral-100 rounded-lg">
          <TabButton
            label="Schedule"
            isActive={scheduleView === "all"}
            onPress={() => {
              clearScheduleHighlight();
              setScheduleView("all");
            }}
          />
          <TabButton
            label="My Schedule"
            isActive={scheduleView === "my"}
            onPress={() => {
              clearScheduleHighlight();
              setScheduleView("my");
            }}
          />
        </View>
        ) : null}

        {/* Filter Controls - Stage dropdown + Filter for both Schedule and My Schedule */}
        <View className="flex-row items-center justify-center mb-4 px-4 pt-2 gap-3">
          <DropdownButton
            label={stageOptions.find((o) => o.value === selectedStage)?.label ?? "Stage"}
            icon="list"
            options={stageOptions}
            selectedValue={selectedStage}
            onSelect={(value) => {
              setSelectedStage(value);
            }}
            width="65%"
          />
          <DropdownButton
            label="Filter"
            icon="filter"
            onPress={() => setIsFilterModalVisible(true)}
            width="30%"
          />
        </View>
      </View>

      {/* Scrollable Event Cards */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => {
          scrollViewportHeightRef.current = e.nativeEvent.layout.height;
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={
              scheduleView === "all"
                ? onRefresh
                : () => fetchMySchedules()
            }
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <View ref={listContentRef} className="px-4" collapsable={false}>
          {scheduleView === "all" ? (
            isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <LoadingSpinner size="large" />
                <Text className="text-gray-500 mt-4">Loading events...</Text>
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center py-20 px-4">
                <Text className="text-red-600 text-center mb-4">{error}</Text>
                <Pressable
                  onPress={() =>
                    void fetchEventSchedules({ force: true, showLoading: true })
                  }
                  className="bg-black rounded-md px-6 py-3"
                >
                  <Text className="text-white font-medium">Retry</Text>
                </Pressable>
              </View>
            ) : events.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500 text-center">
                  Schedule is not yet live, kindly check back.
                </Text>
              </View>
            ) : (
              events.map((event) => {
                const scheduleId = event?.eventScheduleId ?? 0;
                const isHighlighted = pulseScheduleId === scheduleId;
                return (
                <View
                  key={event?.id || `event-${Math.random()}`}
                  ref={(node) => {
                    if (!scheduleId) return;
                    if (node) {
                      cardViewRefs.current.set(scheduleId, node);
                      measureCardLayout(scheduleId, node);
                    } else {
                      cardViewRefs.current.delete(scheduleId);
                    }
                  }}
                  onLayout={() => {
                    const node = cardViewRefs.current.get(scheduleId);
                    if (node) measureCardLayout(scheduleId, node);
                  }}
                  style={{
                    marginBottom: 4,
                    borderRadius: 12,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                <Pressable
                  onPress={() => {
                    if (event) {
                      clearScheduleHighlight();
                      setSelectedEvent(event);
                      setIsEventViewModalVisible(true);
                    }
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <EventCard
                    title={event?.title || ""}
                    stage={event?.stage || ""}
                    day={event?.day || ""}
                    startTime={event?.startTime || ""}
                    endTime={event?.endTime || ""}
                    sponsoredBy={event?.sponsoredBy}
                    onAddToSchedule={
                      SCHEDULE_SESSION_CTAS_ENABLED
                        ? () => handleAddToSchedule(event)
                        : undefined
                    }
                    onLeaveFeedback={
                      SCHEDULE_SESSION_CTAS_ENABLED
                        ? () => handleLeaveFeedback(event)
                        : undefined
                    }
                    isInMySchedule={
                      SCHEDULE_SESSION_CTAS_ENABLED &&
                      addedScheduleIds.has(event?.eventScheduleId ?? 0)
                    }
                    isAddingToSchedule={
                      addingScheduleId === event?.eventScheduleId
                    }
                  />
                </Pressable>
                {isHighlighted ? (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      zIndex: 2,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#1BB273",
                      backgroundColor: "rgba(27, 178, 115, 0.14)",
                      opacity: highlightOpacity,
                    }}
                  />
                ) : null}
                </View>
              );
              })
            )
          ) : myScheduleLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <LoadingSpinner size="large" />
              <Text className="text-gray-500 mt-4">Loading your schedule...</Text>
            </View>
          ) : mySchedules.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <Text className="text-gray-500 text-center text-base mb-2">
                No sessions in your schedule
              </Text>
              <Text className="text-neutral-400 text-center text-sm">
                Tap "Add to schedule" on the Schedule tab to add sessions.
              </Text>
            </View>
          ) : filteredMySchedules.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <Text className="text-gray-500 text-center text-base mb-2">
                No sessions match the selected stage or filters
              </Text>
              <Text className="text-neutral-400 text-center text-sm">
                Try changing the stage or filter above.
              </Text>
            </View>
          ) : (
            filteredMySchedules.map((event) => (
              <Pressable
                key={event?.id || `my-${event?.personalScheduleId ?? Math.random()}`}
                onPress={() => {
                  if (event) {
                    setSelectedEvent(event);
                    setIsEventViewModalVisible(true);
                  }
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <EventCard
                  title={event?.title || ""}
                  stage={event?.stage || ""}
                  day={event?.day || ""}
                  startTime={event?.startTime || ""}
                  endTime={event?.endTime || ""}
                  sponsoredBy={event?.sponsoredBy}
                  onRemoveFromSchedule={
                    SCHEDULE_SESSION_CTAS_ENABLED
                      ? () => handleRemoveFromSchedule(event)
                      : undefined
                  }
                  onLeaveFeedback={
                    SCHEDULE_SESSION_CTAS_ENABLED
                      ? () => handleLeaveFeedback(event)
                      : undefined
                  }
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(filters) => {
          setSelectedFilters(filters);
        }}
        categories={filterCategories}
        initialSelected={selectedFilters}
      />

      {selectedEvent && (
        <EventViewModal
          visible={isEventViewModalVisible}
          onClose={() => {
            setIsEventViewModalVisible(false);
            setSelectedEvent(null);
            clearScheduleHighlight();
          }}
          title={selectedEvent?.title || ""}
          startTime={selectedEvent?.startTime || ""}
          endTime={selectedEvent?.endTime || ""}
          stage={selectedEvent?.stage || ""}
          sponsoredBy={selectedEvent?.sponsoredBy}
          speakers={(selectedEvent?.speakers || []).map((speaker: Speaker) => {
            return {
              ...speaker,
                  onPress: () => {
                if (speaker?.id) {
                  setIsEventViewModalVisible(false);
                  setSelectedEvent(null);
                  setSelectedSpeakerId(String(speaker.id));
                  setSelectedSpeakerName(speaker.name);
                  setSpeakerModalVisible(true);
                }
              },
            };
          })}
          description={selectedEvent?.description}
          onAddToSchedule={
            !SCHEDULE_SESSION_CTAS_ENABLED
              ? undefined
              : selectedEvent?.personalScheduleId ||
                  (selectedEvent &&
                    addedScheduleIds.has(selectedEvent.eventScheduleId))
                ? undefined
                : () => handleAddToSchedule(selectedEvent)
          }
          onRemoveFromSchedule={
            SCHEDULE_SESSION_CTAS_ENABLED && selectedEvent?.personalScheduleId
              ? () => handleRemoveFromSchedule(selectedEvent)
              : undefined
          }
          isInMySchedule={
            SCHEDULE_SESSION_CTAS_ENABLED &&
            (!!selectedEvent?.personalScheduleId ||
              (!!selectedEvent &&
                addedScheduleIds.has(selectedEvent.eventScheduleId)))
          }
          onLeaveFeedback={
            SCHEDULE_SESSION_CTAS_ENABLED
              ? () => {
                  handleLeaveFeedback(selectedEvent);
                  setIsEventViewModalVisible(false);
                }
              : undefined
          }
          isAddingToSchedule={
            !!selectedEvent &&
            addingScheduleId === selectedEvent.eventScheduleId
          }
        />
      )}

      {/* Note: LeaveFeedbackModal is kept for UI consistency, but feedback is handled via external link */}
      <LeaveFeedbackModal
        visible={isLeaveFeedbackModalVisible}
        onClose={() => setIsLeaveFeedbackModalVisible(false)}
        onSubmit={(feedback: string) => {
          // Feedback is handled via external link (handleLeaveFeedback)
          // This modal can be used for future backend integration
          setIsLeaveFeedbackModalVisible(false);
          setIsFeedbackSentModalVisible(true);
        }}
        eventTitle={selectedEvent?.title}
      />

      <FeedbackSentModal
        visible={isFeedbackSentModalVisible}
        onClose={() => {
          setIsFeedbackSentModalVisible(false);
        }}
        meetingTitle={selectedEvent?.title}
      />

      <SpeakerDetailModal
        visible={speakerModalVisible && !!selectedSpeakerId}
        onClose={() => {
          setSpeakerModalVisible(false);
          setSelectedSpeakerId(null);
          setSelectedSpeakerName(undefined);
        }}
        speakerId={selectedSpeakerId || ""}
        name={selectedSpeakerName}
      />

      <ScheduleSuccessToast
        visible={scheduleToastVisible}
        onHide={hideScheduleToast}
        eventTitle={scheduleToastTitle}
        variant={scheduleToastVariant}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />

      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Schedule"
          onNavigate={(route) => {
            if (route === "Home") {
              navigateRef("Home");
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              // Already on Schedule screen
            } else if (route === "Meetings") {
              navigation.navigate("Meetings");
            } else if (route === "Connections") {
              navigation.navigate("Connections");
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
