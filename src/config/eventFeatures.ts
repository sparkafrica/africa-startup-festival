import { isPostEventMode } from "./eventMode";

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
}

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
    showUpgradeTicket: false,
  };
}
