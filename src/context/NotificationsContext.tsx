import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
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

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.user_id) {
      setHasUnreadNotifications(false);
      return;
    }
    try {
      const { notifications } = await notificationService.getNotifications(
        1,
        50,
        "-timestamp"
      );
      const hasUnread = notifications.some((n) => !n.is_read);
      setHasUnreadNotifications(hasUnread);
    } catch {
      setHasUnreadNotifications(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    refreshUnreadCount();
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
