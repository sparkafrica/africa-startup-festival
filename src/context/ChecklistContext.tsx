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

const CHECKLIST_STORAGE_KEY_PREFIX = "@spark:checklist_user:";

interface ChecklistState {
  connectAttendees: boolean;
  requestMeeting: boolean;
  addSessions: boolean;
}

interface ChecklistContextType {
  markConnectAttendeesComplete: () => void;
  markRequestMeetingComplete: () => void;
  markAddSessionsComplete: () => void;
  isConnectAttendeesComplete: boolean;
  isRequestMeetingComplete: boolean;
  isAddSessionsComplete: boolean;
  resetChecklist: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(
  undefined
);

const defaultState: ChecklistState = {
  connectAttendees: false,
  requestMeeting: false,
  addSessions: false,
};

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_id != null ? String(user.user_id) : null;
  const [checklistCompleted, setChecklistCompleted] =
    useState<ChecklistState>(defaultState);
  const isMountedRef = useRef(false);

  const storageKey = userId ? `${CHECKLIST_STORAGE_KEY_PREFIX}${userId}` : null;

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
    [storageKey]
  );

  useEffect(() => {
    if (!userId) {
      setChecklistCompleted(defaultState);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(
          `${CHECKLIST_STORAGE_KEY_PREFIX}${userId}`
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
  }, [userId]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    persistChecklist(checklistCompleted);
  }, [checklistCompleted, persistChecklist]);

  const markConnectAttendeesComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      connectAttendees: true,
    }));
  }, []);

  const markRequestMeetingComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      requestMeeting: true,
    }));
  }, []);

  const markAddSessionsComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      addSessions: true,
    }));
  }, []);

  const resetChecklist = useCallback(() => {
    setChecklistCompleted(defaultState);
  }, []);

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
