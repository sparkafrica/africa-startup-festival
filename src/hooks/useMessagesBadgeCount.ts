import { useMessagesBadgeContext } from "../context/MessagesBadgeContext";

/**
 * Returns the unread messages badge count from shared context.
 * Must be used inside MessagesBadgeProvider so the count is consistent across screens.
 * Use useMessagesBadgeContext() when you also need refresh().
 */
export function useMessagesBadgeCount(): number {
  const { count } = useMessagesBadgeContext();
  return count;
}

