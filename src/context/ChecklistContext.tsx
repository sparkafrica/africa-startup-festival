import React, { createContext, useContext, useState, useCallback } from "react";

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

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [checklistCompleted, setChecklistCompleted] = useState({
    connectAttendees: false,
    requestMeeting: false,
    addSessions: false,
  });

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

