import type { RootStackParamList } from "./types";
import type { DeepLinkTarget } from "./deepLinkParse";
import { isPostEventMode } from "../config/eventMode";
import { navigate } from "./navigationRef";

const POST_EVENT_BLOCKED_SCREENS = new Set<DeepLinkTarget["screen"]>([
  "Schedule",
  "TagPickup",
]);

export function paramsForDeepLinkTarget(
  target: DeepLinkTarget,
): {
  screen: keyof RootStackParamList;
  params?: RootStackParamList[keyof RootStackParamList];
} {
  switch (target.screen) {
    case "Schedule":
      if ("scheduleId" in target && target.scheduleId != null) {
        return {
          screen: "Schedule",
          params: { highlightScheduleId: target.scheduleId },
        };
      }
      return { screen: "Schedule" };
    case "Connections":
      if ("connectionId" in target && target.connectionId != null) {
        return {
          screen: "Connections",
          params: { highlightConnectionId: target.connectionId },
        };
      }
      return { screen: "Connections" };
    case "Attendees":
      if ("userId" in target && target.userId) {
        return {
          screen: "Attendees",
          params: { highlightUserId: target.userId },
        };
      }
      return { screen: "Attendees" };
    case "Exhibitors":
      if ("companyId" in target && target.companyId != null) {
        return {
          screen: "Exhibitors",
          params: { highlightCompanyId: String(target.companyId) },
        };
      }
      return { screen: "Exhibitors" };
    case "Partners":
      if ("companyId" in target && target.companyId != null) {
        return {
          screen: "Partners",
          params: { highlightCompanyId: String(target.companyId) },
        };
      }
      return { screen: "Partners" };
    case "Meetings":
      if ("meetingId" in target && target.meetingId != null) {
        return {
          screen: "Meetings",
          params: {
            primaryTab: target.primaryTab,
            secondaryTab: target.secondaryTab,
            highlightMeetingId: target.meetingId,
          },
        };
      }
      return {
        screen: "Meetings",
        params:
          target.primaryTab || target.secondaryTab
            ? {
                primaryTab: target.primaryTab,
                secondaryTab: target.secondaryTab,
              }
            : undefined,
      };
    case "Profile":
      return { screen: "Profile" };
    case "TagPickup":
      return { screen: "TagPickup" };
    default:
      return { screen: "Home" };
  }
}

export function navigateDeepLinkTarget(target: DeepLinkTarget): boolean {
  if (isPostEventMode() && POST_EVENT_BLOCKED_SCREENS.has(target.screen)) {
    navigate("Home");
    return true;
  }
  const { screen, params } = paramsForDeepLinkTarget(target);
  navigate(screen, params as never);
  return true;
}
