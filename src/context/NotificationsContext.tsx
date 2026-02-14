import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/notificationService";

interface NotificationsContextType {
  hasUnreadNotifications: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const appState = useRef(AppState.currentState);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.user_id) {
      setHasUnreadNotifications(false);
      try {
        await Notifications.setBadgeCountAsync(0);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const { notifications } = await notificationService.getNotifications(
        1,
        50,
        "-timestamp"
      );
      const hasUnread = notifications.some((n) => !n.is_read);
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      setHasUnreadNotifications(hasUnread);
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch {
      setHasUnreadNotifications(false);
      try {
        await Notifications.setBadgeCountAsync(0);
      } catch {
        /* ignore */
      }
    }
  }, [user?.user_id]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Refetch when app comes to foreground (e.g. user opens from push notification)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        refreshUnreadCount();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{ hasUnreadNotifications, refreshUnreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      hasUnreadNotifications: false,
      refreshUnreadCount: async () => {},
    };
  }
  return ctx;
}
