import React, { useCallback, useMemo } from "react";
import { useNavigationState } from "@react-navigation/native";
import FloatingBottomNav from "../components/FloatingBottomNav";
import { useMeetingsBadgeCount } from "../hooks/useMeetingsBadgeCount";
import { useHomeScroll } from "../context/HomeScrollContext";
import { useFloatingNavVisibility } from "../context/FloatingNavVisibilityContext";
import { getActiveRouteName } from "../utils/analytics";
import { navigate } from "./navigationRef";
import { getEventFeatures } from "../config/eventFeatures";
import {
  createMainTabItems,
  createPostEventMainTabItems,
  isNavVisibleRoute,
  resolveActiveTabRoute,
  type MainTabRoute,
} from "./mainTabConfig";

export default function FloatingBottomNavHost() {
  const routeName = useNavigationState(
    (state) => getActiveRouteName(state) ?? "",
  );
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { scrollHomeToTop } = useHomeScroll();
  const { suppressed } = useFloatingNavVisibility();
  const postEvent = getEventFeatures().postEvent;

  const items = useMemo(
    () =>
      postEvent
        ? createPostEventMainTabItems(meetingsBadgeCount)
        : createMainTabItems(meetingsBadgeCount),
    [meetingsBadgeCount, postEvent],
  );

  const activeRoute = resolveActiveTabRoute(routeName, postEvent);
  const visible = isNavVisibleRoute(routeName);

  const handleNavigate = useCallback(
    (route: string) => {
      const tab = route as MainTabRoute;
      if (tab === "Home" && routeName === "Home") {
        scrollHomeToTop();
        return;
      }
      if (tab === routeName) return;
      navigate(tab);
    },
    [routeName, scrollHomeToTop],
  );

  return (
    <FloatingBottomNav
      items={items}
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      hidden={!visible || suppressed}
    />
  );
}
