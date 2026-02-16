/**
 * Sets up push tap handlers (getInitialNotification, onNotificationOpenedApp)
 * when the user is authenticated. Must be inside AuthProvider.
 */
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { setupPushTapHandlers } from "../utils/pushNavigation";

export default function PushTapHandler() {
  const { isAuthenticated, hasCompletedProfile } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !hasCompletedProfile) return;
    const unsubscribe = setupPushTapHandlers();
    return unsubscribe;
  }, [isAuthenticated, hasCompletedProfile]);

  return null;
}
