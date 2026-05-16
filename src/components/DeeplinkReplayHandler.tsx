/**
 * Replays a captured deeplink after the user reaches the main app (auth + profile).
 */
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { consumePendingDeeplink } from "../utils/pendingDeeplink";
import { navigateFromDeepLinkUrl } from "../navigation/deepLinkRoutes";
import { isReady } from "../navigation/navigationRef";

const NAV_READY_INTERVAL_MS = 50;
const NAV_READY_MAX_WAIT_MS = 4000;

function waitForNavReady(): Promise<void> {
  return new Promise((resolve) => {
    if (isReady()) {
      resolve();
      return;
    }
    const start = Date.now();
    const check = () => {
      if (isReady() || Date.now() - start >= NAV_READY_MAX_WAIT_MS) {
        resolve();
        return;
      }
      setTimeout(check, NAV_READY_INTERVAL_MS);
    };
    setTimeout(check, NAV_READY_INTERVAL_MS);
  });
}

export default function DeeplinkReplayHandler() {
  const { isAuthenticated, hasCompletedProfile, isLoading } = useAuth();
  const replayedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !hasCompletedProfile) {
      replayedRef.current = false;
      return;
    }

    const url = consumePendingDeeplink();
    if (!url || replayedRef.current) return;

    replayedRef.current = true;
    waitForNavReady().then(() => {
      navigateFromDeepLinkUrl(url);
    });
  }, [isAuthenticated, hasCompletedProfile, isLoading]);

  return null;
}
