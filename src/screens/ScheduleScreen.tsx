import React, { useCallback, useMemo } from "react";
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
import {
  HeaderBar,
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
  FLOATING_NAV_BOTTOM_INSET,
  type FilterCategory,
  type Speaker,
} from "../components";
import Toast from "../components/Toast";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useChecklist } from "../context/ChecklistContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import {
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import { eventService, type EventSchedule, type PersonalSchedule } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import {
  SCHEDULE_MOCK_PREVIEW_ENABLED,
  SCHEDULE_SESSION_CTAS_ENABLED,
  SESSION_FEEDBACK_FORM_URL,
} from "../config/scheduleFeatures";
import { parseScheduleCardMetadata } from "../utils/scheduleMetadata";
import type { ScheduleBadgeColor } from "../utils/scheduleMetadata";
import { ApiClientError } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  DAY_FILTER_ID_TO_ISO_DATE,
  deriveDayLabel,
  filterEventSchedules,
  scheduleStartDateIso,
  scheduleVenue,
  scheduleVenueToStageKey,
  setExpoEventDates,
} from "../utils/scheduleFilters";
import {
  getDefaultScheduleDayFilterIds,
} from "../utils/eventDay";
import {
  isSessionSoonOrLive,
  parseScheduleTimes,
} from "../utils/scheduleUpcoming";
import { resolveEventScheduleById } from "../services/deepLinkResolveService";
import {
  clearCachedEventSchedules,
  clearCachedEventSpeakers,
  enrichEventScheduleFromCache,
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
import {
  getCanUserAddEnterpriseStageToSchedule,
  isEnterpriseStageSession,
  showEnterpriseStageScheduleBlockedAlert,
} from "../utils/scheduleRestrictions";

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
  endTimeMs: Date.parse("2026-06-26T11:00:00"),
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
// SCHEDULE EXTERNAL LINKS
// ============================================================================
// - Leave a Feedback → SESSION_FEEDBACK_FORM_URL (Typeform), cards + detail sheet
// - AMA Q&A → schedule.metadata.slidoUrl, detail sheet only (EventViewModal)
// - sessionBadge (e.g. "AMA Session") → schedule.metadata, cards + detail sheet
// ============================================================================

const HIGHLIGHT_PULSE_MS = 3000;
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
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { markDay2SessionFeedbackComplete } = useChecklist();
  const { hasUnreadNotifications } = useNotifications();
  const [scheduleView, setScheduleView] = React.useState<"all" | "my">("all");
  const [selectedStage, setSelectedStage] =
    React.useState<string>("main-stage");
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(() =>
    getDefaultScheduleDayFilterIds(),
  );
  interface EventData {
    id: string;
    eventScheduleId: number; // Backend schedule id for addEventToSchedule
    title: string;
    stage: string;
    day: string;
    startTime: string;
    endTime: string;
    sessionBadge?: { label: string; color?: ScheduleBadgeColor };
    sponsoredBy?: { name: string; color?: ScheduleBadgeColor };
    slidoUrl?: string;
    speakers?: Speaker[];
    description?: string;
    personalScheduleId?: number; // For My Schedule tab: backend personal schedule id (remove from schedule)
    /** UTC ms from schedule.start_time — used for chronological sort */
    startTimeMs: number;
    /** UTC ms from schedule.end_time */
    endTimeMs: number;
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
  const isEventModalClosingRef = React.useRef(false);
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
    const scheduleRow = enrichEventScheduleFromCache(schedule);

    // Parse start_time and end_time (ISO 8601 format)
    const startDate = new Date(scheduleRow.start_time);
    const endDate = new Date(scheduleRow.end_time);

    // Format time as "10:00 AM"
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, "0");
      return `${hour12}:${minutesStr} ${period}`;
    };

    const eventObj =
      typeof scheduleRow.event === "object" ? scheduleRow.event : null;
    const stage = scheduleVenue(scheduleRow);

    const { sponsoredBy, sessionBadge, slidoUrl } = parseScheduleCardMetadata(
      scheduleRow.metadata,
      eventObj?.metadata,
    );

    const parsed = parseScheduleSpeakersRaw(scheduleRow.speakers);
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
      id: `schedule-${scheduleRow.id}`,
      eventScheduleId: scheduleRow.id,
      title: scheduleRow.name,
      stage: stage,
      day: deriveDayLabel(scheduleRow.start_time, scheduleRow.event),
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      startTimeMs: startDate.getTime(),
      endTimeMs: endDate.getTime(),
      scheduleDateIso: scheduleStartDateIso(scheduleRow.start_time),
      sessionBadge: sessionBadge
        ? {
            label: sessionBadge.label,
            color: sessionBadge.color ?? "purple",
          }
        : undefined,
      sponsoredBy: sponsoredBy
        ? {
            name: sponsoredBy.name,
            color: sponsoredBy.color ?? "blue",
          }
        : undefined,
      slidoUrl,
      speakers: speakers,
      description:
        scheduleRow.description ||
        (typeof scheduleRow.event === "object"
          ? scheduleRow.event.description
          : undefined),
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
    const dayFilterIds = route.params?.dayFilterIds;
    if (!dayFilterIds?.length) return;
    setSelectedFilters(dayFilterIds);
    setScheduleView("all");
    navigation.setParams({ dayFilterIds: undefined });
  }, [route.params?.dayFilterIds, navigation]);

  React.useEffect(() => {
    const initialStage = route.params?.initialStage;
    if (!initialStage) return;
    setSelectedStage(initialStage);
    setScheduleView("all");
    navigation.setParams({ initialStage: undefined });
  }, [route.params?.initialStage, navigation]);

  const soonScheduleIds = React.useMemo(() => {
    const now = Date.now();
    const ids = new Set<number>();
    for (const event of events) {
      if (
        isSessionSoonOrLive(event.startTimeMs, event.endTimeMs, now)
      ) {
        ids.add(event.eventScheduleId);
      }
    }
    return ids;
  }, [events]);

  const scrolledSoonRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      scrolledSoonRef.current = false;
    }, []),
  );

  React.useEffect(() => {
    if (
      scheduleView !== "all" ||
      isLoading ||
      highlightTargetId != null ||
      scrolledSoonRef.current
    ) {
      return;
    }
    const firstSoon = events.find((e) =>
      soonScheduleIds.has(e.eventScheduleId),
    );
    if (!firstSoon) return;
    scrolledSoonRef.current = true;
    const timer = setTimeout(() => {
      scrollToCenteredSchedule(firstSoon.eventScheduleId);
    }, 450);
    return () => clearTimeout(timer);
  }, [
    events,
    soonScheduleIds,
    scheduleView,
    isLoading,
    highlightTargetId,
    scrollToCenteredSchedule,
  ]);

  React.useEffect(() => {
    const targetId = highlightTargetId;
    if (targetId == null || scheduleView !== "all" || isLoading) return;

    const index = events.findIndex((e) => e.eventScheduleId === targetId);
    if (index < 0) {
      let cancelled = false;
      void (async () => {
        const schedule = await resolveEventScheduleById(targetId);
        if (cancelled || !schedule) return;
        setSelectedStage(scheduleVenueToStageKey(scheduleVenue(schedule)));
        setSelectedFilters([]);
        const row = mapEventScheduleToEventData(schedule);
        setEvents((prev) => {
          if (prev.some((e) => e.eventScheduleId === row.eventScheduleId)) {
            return prev;
          }
          return sortEventsByStartTime([...prev, row]);
        });
      })();
      return () => {
        cancelled = true;
      };
    }

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
      await Promise.all([
        fetchAndCacheSpeakers(),
        ensureEventProgramme(),
      ]);
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

    if (isEnterpriseStageSession(event.stage)) {
      const canAdd = await getCanUserAddEnterpriseStageToSchedule();
      if (!canAdd) {
        showEnterpriseStageScheduleBlockedAlert(navigation);
        return;
      }
    }

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

  const handleLeaveFeedback = async () => {
    try {
      const supported = await Linking.canOpenURL(SESSION_FEEDBACK_FORM_URL);
      if (supported) {
        await Linking.openURL(SESSION_FEEDBACK_FORM_URL);
        markDay2SessionFeedbackComplete();
        return;
      }
      await Linking.openURL(SESSION_FEEDBACK_FORM_URL);
      markDay2SessionFeedbackComplete();
    } catch (error) {
      if (__DEV__) {
        console.error("Error opening feedback form:", error);
      }
      Alert.alert(
        "Cannot open feedback form",
        "Please try again or open the form in your browser.",
      );
    }
  };

  const handleOpenSlido = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      if (__DEV__) {
        console.error("Error opening Slido:", error);
      }
      Alert.alert(
        "Cannot open Q&A",
        "Please try again or open the link in your browser.",
      );
    }
  };

  const openEventDetail = useCallback((event: EventData) => {
    if (isEventModalClosingRef.current) return;
    setSelectedEvent(event);
    setIsEventViewModalVisible(true);
  }, []);

  const closeEventViewModal = useCallback(() => {
    isEventModalClosingRef.current = false;
    setIsEventViewModalVisible(false);
    clearScheduleHighlight();
  }, [clearScheduleHighlight]);

  const handleEventViewModalDismissStart = useCallback(() => {
    isEventModalClosingRef.current = true;
  }, []);

  const handleSpeakerPressFromEvent = useCallback(
    (speakerId: string, speakerName: string) => {
      setIsEventViewModalVisible(false);
      setSelectedSpeakerId(speakerId);
      setSelectedSpeakerName(speakerName);
      setSpeakerModalVisible(true);
    },
    [],
  );

  const eventViewSpeakers = useMemo(() => {
    if (!selectedEvent?.speakers?.length) return [];
    return selectedEvent.speakers.map((speaker) => ({
      ...speaker,
      onPress: speaker.id
        ? () =>
            handleSpeakerPressFromEvent(String(speaker.id), speaker.name)
        : undefined,
    }));
  }, [selectedEvent?.speakers, handleSpeakerPressFromEvent]);

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
        contentContainerStyle={{
          paddingBottom: FLOATING_NAV_BOTTOM_INSET + 28,
        }}
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
                  <EventCard
                    title={event?.title || ""}
                    stage={event?.stage || ""}
                    day={event?.day || ""}
                    startTime={event?.startTime || ""}
                    endTime={event?.endTime || ""}
                    sessionBadge={event?.sessionBadge}
                    sponsoredBy={event?.sponsoredBy}
                    onOpenDetail={
                      event ? () => openEventDetail(event) : undefined
                    }
                    onAddToSchedule={
                      SCHEDULE_SESSION_CTAS_ENABLED
                        ? () => handleAddToSchedule(event)
                        : undefined
                    }
                    onLeaveFeedback={
                      SCHEDULE_SESSION_CTAS_ENABLED
                        ? () => void handleLeaveFeedback()
                        : undefined
                    }
                    isInMySchedule={
                      SCHEDULE_SESSION_CTAS_ENABLED &&
                      addedScheduleIds.has(event?.eventScheduleId ?? 0)
                    }
                    isAddingToSchedule={
                      addingScheduleId === event?.eventScheduleId
                    }
                    happeningSoon={soonScheduleIds.has(scheduleId)}
                  />
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
              <EventCard
                key={event?.id || `my-${event?.personalScheduleId ?? Math.random()}`}
                title={event?.title || ""}
                stage={event?.stage || ""}
                day={event?.day || ""}
                startTime={event?.startTime || ""}
                endTime={event?.endTime || ""}
                sessionBadge={event?.sessionBadge}
                sponsoredBy={event?.sponsoredBy}
                onOpenDetail={event ? () => openEventDetail(event) : undefined}
                onRemoveFromSchedule={
                  SCHEDULE_SESSION_CTAS_ENABLED
                    ? () => handleRemoveFromSchedule(event)
                    : undefined
                }
                onLeaveFeedback={
                  SCHEDULE_SESSION_CTAS_ENABLED
                    ? () => void handleLeaveFeedback()
                    : undefined
                }
              />
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

      <EventViewModal
        visible={isEventViewModalVisible}
        contentKey={
          selectedEvent?.eventScheduleId ?? selectedEvent?.id ?? "none"
        }
        onDismissStart={handleEventViewModalDismissStart}
        onClose={closeEventViewModal}
        title={selectedEvent?.title ?? ""}
        startTime={selectedEvent?.startTime ?? ""}
        endTime={selectedEvent?.endTime ?? ""}
        stage={selectedEvent?.stage ?? ""}
        sessionBadge={selectedEvent?.sessionBadge}
        sponsoredBy={selectedEvent?.sponsoredBy}
        speakers={eventViewSpeakers}
        description={selectedEvent?.description}
        slidoUrl={selectedEvent?.slidoUrl}
        onOpenSlido={
          selectedEvent?.slidoUrl
            ? () => void handleOpenSlido(selectedEvent.slidoUrl!)
            : undefined
        }
        onAddToSchedule={
          !SCHEDULE_SESSION_CTAS_ENABLED || !selectedEvent
            ? undefined
            : selectedEvent.personalScheduleId ||
                addedScheduleIds.has(selectedEvent.eventScheduleId)
              ? undefined
              : () => handleAddToSchedule(selectedEvent)
        }
        onRemoveFromSchedule={
          SCHEDULE_SESSION_CTAS_ENABLED && selectedEvent?.personalScheduleId
            ? () => handleRemoveFromSchedule(selectedEvent)
            : undefined
        }
        isInMySchedule={
          !!selectedEvent &&
          SCHEDULE_SESSION_CTAS_ENABLED &&
          (!!selectedEvent.personalScheduleId ||
            addedScheduleIds.has(selectedEvent.eventScheduleId))
        }
        onLeaveFeedback={
          SCHEDULE_SESSION_CTAS_ENABLED
            ? () => {
                void handleLeaveFeedback();
                closeEventViewModal();
              }
            : undefined
        }
        isAddingToSchedule={
          !!selectedEvent &&
          addingScheduleId === selectedEvent.eventScheduleId
        }
      />

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
    </View>
  );
}
