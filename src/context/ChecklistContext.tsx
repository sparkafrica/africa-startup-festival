import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { authService } from "../services/authService";
import { getSafeMetadataObjectForMerge } from "../utils/sanitizeUserMetadata";

const CHECKLIST_STORAGE_KEY_PREFIX = "@spark:checklist_user:";
const DAY2_CHECKLIST_STORAGE_KEY_PREFIX = "@spark:checklist_day2_user:";
const METADATA_CHECKLIST_KEY = "event_checklist";
const METADATA_DAY2_CHECKLIST_KEY = "event_checklist_day2";

interface ChecklistState {
  connectAttendees: boolean;
  requestMeeting: boolean;
  addSessions: boolean;
}

interface Day2ChecklistState {
  addSession: boolean;
  scanAttendee: boolean;
  viewVenueMap: boolean;
  sessionFeedback: boolean;
}

interface ChecklistContextType {
  markConnectAttendeesComplete: () => void;
  markRequestMeetingComplete: () => void;
  markAddSessionsComplete: () => void;
  isConnectAttendeesComplete: boolean;
  isRequestMeetingComplete: boolean;
  isAddSessionsComplete: boolean;
  resetChecklist: () => void;
  markDay2AddSessionComplete: () => void;
  markDay2ScanAttendeeComplete: () => void;
  markDay2ViewVenueMapComplete: () => void;
  markDay2SessionFeedbackComplete: () => void;
  isDay2AddSessionComplete: boolean;
  isDay2ScanAttendeeComplete: boolean;
  isDay2ViewVenueMapComplete: boolean;
  isDay2SessionFeedbackComplete: boolean;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(
  undefined,
);

const defaultState: ChecklistState = {
  connectAttendees: false,
  requestMeeting: false,
  addSessions: false,
};

const defaultDay2State: Day2ChecklistState = {
  addSession: false,
  scanAttendee: false,
  viewVenueMap: false,
  sessionFeedback: false,
};

function parseChecklistFromMetadata(metadata: any): ChecklistState | null {
  if (metadata == null) return null;
  const raw =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata);
          } catch {
            return null;
          }
        })()
      : metadata;
  const checklist = raw?.[METADATA_CHECKLIST_KEY];
  if (!checklist || typeof checklist !== "object") return null;
  return {
    connectAttendees: !!checklist.connectAttendees,
    requestMeeting: !!checklist.requestMeeting,
    addSessions: !!checklist.addSessions,
  };
}

function parseDay2ChecklistFromMetadata(metadata: any): Day2ChecklistState | null {
  if (metadata == null) return null;
  const raw =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata);
          } catch {
            return null;
          }
        })()
      : metadata;
  const checklist = raw?.[METADATA_DAY2_CHECKLIST_KEY];
  if (!checklist || typeof checklist !== "object") return null;
  return {
    addSession: !!checklist.addSession,
    scanAttendee: !!checklist.scanAttendee,
    viewVenueMap: !!checklist.viewVenueMap,
    sessionFeedback: !!checklist.sessionFeedback,
  };
}

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_id != null ? String(user.user_id) : null;
  const [checklistCompleted, setChecklistCompleted] =
    useState<ChecklistState>(defaultState);
  const [day2ChecklistCompleted, setDay2ChecklistCompleted] =
    useState<Day2ChecklistState>(defaultDay2State);
  const isMountedRef = useRef(false);
  const isDay2MountedRef = useRef(false);

  const storageKey = userId ? `${CHECKLIST_STORAGE_KEY_PREFIX}${userId}` : null;
  const day2StorageKey = userId
    ? `${DAY2_CHECKLIST_STORAGE_KEY_PREFIX}${userId}`
    : null;

  const persistChecklist = useCallback(
    async (state: ChecklistState) => {
      if (!storageKey) return;
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {
        if (__DEV__) {
          console.warn("Failed to persist checklist:", e);
        }
      }
    },
    [storageKey],
  );

  const persistDay2Checklist = useCallback(
    async (state: Day2ChecklistState) => {
      if (!day2StorageKey) return;
      try {
        await AsyncStorage.setItem(day2StorageKey, JSON.stringify(state));
      } catch (e) {
        if (__DEV__) {
          console.warn("Failed to persist Day 2 checklist:", e);
        }
      }
    },
    [day2StorageKey],
  );

  const syncChecklistToBackend = useCallback(
    async (state: ChecklistState) => {
      if (!user) return;
      const current = getSafeMetadataObjectForMerge(user.metadata);
      const nextMetadataObj = { ...current, [METADATA_CHECKLIST_KEY]: state };
      try {
        await authService.updateProfile({
          metadata: JSON.stringify(nextMetadataObj),
        });
      } catch (e) {
        if (__DEV__) {
          console.warn("Failed to sync checklist to backend:", e);
        }
      }
    },
    [user],
  );

  const syncDay2ChecklistToBackend = useCallback(
    async (state: Day2ChecklistState) => {
      if (!user) return;
      const current = getSafeMetadataObjectForMerge(user.metadata);
      const nextMetadataObj = {
        ...current,
        [METADATA_DAY2_CHECKLIST_KEY]: state,
      };
      try {
        await authService.updateProfile({
          metadata: JSON.stringify(nextMetadataObj),
        });
      } catch (e) {
        if (__DEV__) {
          console.warn("Failed to sync Day 2 checklist to backend:", e);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (!userId) {
      setChecklistCompleted(defaultState);
      return;
    }
    const fromBackend = parseChecklistFromMetadata(user?.metadata);
    if (fromBackend != null) {
      setChecklistCompleted(fromBackend);
      persistChecklist(fromBackend).catch(() => {});
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(
          `${CHECKLIST_STORAGE_KEY_PREFIX}${userId}`,
        );
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as ChecklistState;
          setChecklistCompleted({
            connectAttendees: !!parsed.connectAttendees,
            requestMeeting: !!parsed.requestMeeting,
            addSessions: !!parsed.addSessions,
          });
        } else {
          setChecklistCompleted(defaultState);
        }
      } catch {
        if (!cancelled) setChecklistCompleted(defaultState);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.metadata, persistChecklist]);

  useEffect(() => {
    if (!userId) {
      setDay2ChecklistCompleted(defaultDay2State);
      return;
    }
    const fromBackend = parseDay2ChecklistFromMetadata(user?.metadata);
    if (fromBackend != null) {
      setDay2ChecklistCompleted(fromBackend);
      persistDay2Checklist(fromBackend).catch(() => {});
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(
          `${DAY2_CHECKLIST_STORAGE_KEY_PREFIX}${userId}`,
        );
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Day2ChecklistState;
          setDay2ChecklistCompleted({
            addSession: !!parsed.addSession,
            scanAttendee: !!parsed.scanAttendee,
            viewVenueMap: !!parsed.viewVenueMap,
            sessionFeedback: !!parsed.sessionFeedback,
          });
        } else {
          setDay2ChecklistCompleted(defaultDay2State);
        }
      } catch {
        if (!cancelled) setDay2ChecklistCompleted(defaultDay2State);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.metadata, persistDay2Checklist]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    persistChecklist(checklistCompleted);
  }, [checklistCompleted, persistChecklist]);

  useEffect(() => {
    if (!isDay2MountedRef.current) {
      isDay2MountedRef.current = true;
      return;
    }
    persistDay2Checklist(day2ChecklistCompleted);
  }, [day2ChecklistCompleted, persistDay2Checklist]);

  const markConnectAttendeesComplete = useCallback(() => {
    setChecklistCompleted((prev) => {
      const next = { ...prev, connectAttendees: true };
      syncChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncChecklistToBackend]);

  const markRequestMeetingComplete = useCallback(() => {
    setChecklistCompleted((prev) => {
      const next = { ...prev, requestMeeting: true };
      syncChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncChecklistToBackend]);

  const markAddSessionsComplete = useCallback(() => {
    setChecklistCompleted((prev) => {
      const next = { ...prev, addSessions: true };
      syncChecklistToBackend(next).catch(() => {});
      return next;
    });
    setDay2ChecklistCompleted((prev) => {
      const next = { ...prev, addSession: true };
      syncDay2ChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncChecklistToBackend, syncDay2ChecklistToBackend]);

  const markDay2AddSessionComplete = useCallback(() => {
    markAddSessionsComplete();
  }, [markAddSessionsComplete]);

  const markDay2ScanAttendeeComplete = useCallback(() => {
    setDay2ChecklistCompleted((prev) => {
      const next = { ...prev, scanAttendee: true };
      syncDay2ChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncDay2ChecklistToBackend]);

  const markDay2ViewVenueMapComplete = useCallback(() => {
    setDay2ChecklistCompleted((prev) => {
      const next = { ...prev, viewVenueMap: true };
      syncDay2ChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncDay2ChecklistToBackend]);

  const markDay2SessionFeedbackComplete = useCallback(() => {
    setDay2ChecklistCompleted((prev) => {
      const next = { ...prev, sessionFeedback: true };
      syncDay2ChecklistToBackend(next).catch(() => {});
      return next;
    });
  }, [syncDay2ChecklistToBackend]);

  const resetChecklist = useCallback(() => {
    setChecklistCompleted(defaultState);
    setDay2ChecklistCompleted(defaultDay2State);
    if (user) {
      const current = getSafeMetadataObjectForMerge(user.metadata);
      const nextMetadataObj = {
        ...current,
        [METADATA_CHECKLIST_KEY]: defaultState,
        [METADATA_DAY2_CHECKLIST_KEY]: defaultDay2State,
      };
      authService
        .updateProfile({ metadata: JSON.stringify(nextMetadataObj) })
        .catch(() => {});
    }
  }, [user]);

  return (
    <ChecklistContext.Provider
      value={{
        markConnectAttendeesComplete,
        markRequestMeetingComplete,
        markAddSessionsComplete,
        isConnectAttendeesComplete: checklistCompleted.connectAttendees,
        isRequestMeetingComplete: checklistCompleted.requestMeeting,
        isAddSessionsComplete: checklistCompleted.addSessions,
        resetChecklist,
        markDay2AddSessionComplete,
        markDay2ScanAttendeeComplete,
        markDay2ViewVenueMapComplete,
        markDay2SessionFeedbackComplete,
        isDay2AddSessionComplete: day2ChecklistCompleted.addSession,
        isDay2ScanAttendeeComplete: day2ChecklistCompleted.scanAttendee,
        isDay2ViewVenueMapComplete: day2ChecklistCompleted.viewVenueMap,
        isDay2SessionFeedbackComplete: day2ChecklistCompleted.sessionFeedback,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error("useChecklist must be used within a ChecklistProvider");
  }
  return context;
}
