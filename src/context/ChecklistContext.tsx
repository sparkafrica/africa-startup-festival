import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
// TODO: BACKEND INTEGRATION - Import AsyncStorage to persist checklist state
// TODO: BACKEND INTEGRATION - Consider fetching checklist status from backend on app start

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

// TODO: BACKEND INTEGRATION - Add AsyncStorage keys for checklist persistence
// const CHECKLIST_STORAGE_KEYS = {
//   CONNECT_ATTENDEES: "@spark:checklist_connect_attendees",
//   REQUEST_MEETING: "@spark:checklist_request_meeting",
//   ADD_SESSIONS: "@spark:checklist_add_sessions",
// };

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  // TODO: BACKEND INTEGRATION - Initialize from AsyncStorage or backend API
  // TODO: BACKEND INTEGRATION - Fetch checklist status from backend on mount
  // TODO: BACKEND INTEGRATION - Sync checklist state with backend (real-time updates)
  const [checklistCompleted, setChecklistCompleted] = useState({
    connectAttendees: false,
    requestMeeting: false,
    addSessions: false,
  });

  // TODO: BACKEND INTEGRATION - Load checklist state from AsyncStorage on mount
  // useEffect(() => {
  //   loadChecklistState();
  // }, []);

  // TODO: BACKEND INTEGRATION - Load from AsyncStorage
  // const loadChecklistState = async () => { ... };

  // TODO: BACKEND INTEGRATION - Save to AsyncStorage on state change
  // useEffect(() => {
  //   saveChecklistState();
  // }, [checklistCompleted]);

  // TODO: BACKEND INTEGRATION - These should be called after successful API operations
  // TODO: BACKEND INTEGRATION - Consider moving these calls to the actual action screens (AttendeesScreen, MeetingsScreen, ScheduleScreen)
  // TODO: BACKEND INTEGRATION - Sync completion status with backend API
  const markConnectAttendeesComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      connectAttendees: true,
    }));
    // TODO: BACKEND - Persist to AsyncStorage: await AsyncStorage.setItem(CHECKLIST_STORAGE_KEYS.CONNECT_ATTENDEES, "true");
    // TODO: BACKEND - Optionally sync with backend: await api.patch('/user/checklist', { connectAttendees: true });
  }, []);

  const markRequestMeetingComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      requestMeeting: true,
    }));
    // TODO: BACKEND - Persist to AsyncStorage: await AsyncStorage.setItem(CHECKLIST_STORAGE_KEYS.REQUEST_MEETING, "true");
    // TODO: BACKEND - Optionally sync with backend: await api.patch('/user/checklist', { requestMeeting: true });
  }, []);

  const markAddSessionsComplete = useCallback(() => {
    setChecklistCompleted((prev) => ({
      ...prev,
      addSessions: true,
    }));
    // TODO: BACKEND - Persist to AsyncStorage: await AsyncStorage.setItem(CHECKLIST_STORAGE_KEYS.ADD_SESSIONS, "true");
    // TODO: BACKEND - Optionally sync with backend: await api.patch('/user/checklist', { addSessions: true });
  }, []);

  const resetChecklist = useCallback(() => {
    setChecklistCompleted({
      connectAttendees: false,
      requestMeeting: false,
      addSessions: false,
    });
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
