import { isPostEventMode } from "./eventMode";

export type HomeDirectoryTabId =
  | "exhibitors"
  | "partners"
  | "startups"
  | "speakers";

export interface EventFeatures {
  postEvent: boolean;
  showPostEventHero: boolean;
  showDay2HomeExtras: boolean;
  showEventDirectoryOnHome: boolean;
  showVenueMapOnHome: boolean;
  showScheduleTab: boolean;
  showAttendeesTab: boolean;
  virtualMeetingsOnly: boolean;
  scanNetworkingEnabled: boolean;
  showUpgradeTicket: boolean;
  /** Menu routes hidden for ASF v1 (Kenya + Lagos). */
  hiddenMenuRoutes: string[];
  /**
   * Home / attendees directory tabs hidden until each list has ~10+ entries.
   * Speakers already qualify and stay visible.
   */
  hiddenHomeDirectoryTabs: HomeDirectoryTabId[];
}

/** ASF v1 — Tag Pickup, Talent, Partner Offers, App Guide deferred. */
export const ASF_HIDDEN_MENU_ROUTES = [
  "Offers",
  "Talent",
  "TagPickup",
  "AppGuide",
  "Startups",
] as const;

/** Hide until exhibitor / partner / startup directories have enough to browse. */
export const ASF_HIDDEN_HOME_DIRECTORY_TABS: HomeDirectoryTabId[] = [
  "exhibitors",
  "partners",
  "startups",
];

export function getEventFeatures(now = Date.now()): EventFeatures {
  const postEvent = isPostEventMode(now);
  return {
    postEvent,
    showPostEventHero: false,
    showDay2HomeExtras: false,
    showEventDirectoryOnHome: true,
    showVenueMapOnHome: false,
    showScheduleTab: !postEvent,
    showAttendeesTab: true,
    virtualMeetingsOnly: postEvent,
    scanNetworkingEnabled: !postEvent,
    showUpgradeTicket: !postEvent,
    hiddenMenuRoutes: [...ASF_HIDDEN_MENU_ROUTES],
    hiddenHomeDirectoryTabs: [...ASF_HIDDEN_HOME_DIRECTORY_TABS],
  };
}
