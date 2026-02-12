import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";

/**
 * Returns the Meetings tab badge count (scheduled + meeting requests) from shared context.
 * Must be used inside MeetingsBadgeProvider so the count is consistent across all screens.
 * Use useMeetingsBadgeContext() when you also need refresh() (e.g. to refetch on screen focus).
 */
export function useMeetingsBadgeCount(): number {
  const { count } = useMeetingsBadgeContext();
  return count;
}
