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
const METADATA_CHECKLIST_KEY = "event_checklist";

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

function parseChecklistFromMetadata(metadata: any): ChecklistState | null {
  if (metadata == null) return null;
  const raw = typeof metadata === "string" ? (() => { try { return JSON.parse(metadata); } catch { return null; } })() : metadata;
  const checklist = raw?.[METADATA_CHECKLIST_KEY];
  if (!checklist || typeof checklist !== "object") return null;
  return {
    connectAttendees: !!checklist.connectAttendees,
    requestMeeting: !!checklist.requestMeeting,
    addSessions: !!checklist.addSessions,
  };
}

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

  // Sync checklist to backend (user profile metadata) so it survives app clear / new device
  // PUT /auth/user/ expects metadata as a string (JSON)
  const syncChecklistToBackend = useCallback(
    async (state: ChecklistState) => {
      if (!user) return;
      const current = getSafeMetadataObjectForMerge(user.metadata);
      const nextMetadataObj = { ...current, [METADATA_CHECKLIST_KEY]: state };
      try {
        await authService.updateProfile({ metadata: JSON.stringify(nextMetadataObj) });
      } catch (e) {
        if (__DEV__) {
          console.warn("Failed to sync checklist to backend:", e);
        }
      }
    },
    [user]
  );

  // Load: prefer backend (user.metadata.event_checklist), then AsyncStorage, then default
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
  }, [userId, user?.metadata, persistChecklist]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    persistChecklist(checklistCompleted);
  }, [checklistCompleted, persistChecklist]);

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
  }, [syncChecklistToBackend]);

  const resetChecklist = useCallback(() => {
    setChecklistCompleted(defaultState);
    if (user) {
      const current = getSafeMetadataObjectForMerge(user.metadata);
      const nextMetadataObj = { ...current, [METADATA_CHECKLIST_KEY]: defaultState };
      authService.updateProfile({ metadata: JSON.stringify(nextMetadataObj) }).catch(() => {});
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
