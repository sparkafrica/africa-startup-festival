import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useMessagesBadgeContext } from "../context/MessagesBadgeContext";

/**
 * Refetches global header message unread count whenever this screen is focused.
 * MessagesScreen should sync via its own fetch instead of this hook to avoid duplicate list calls.
 */
export function useRefreshMessagesBadgeOnFocus() {
  const { refresh } = useMessagesBadgeContext();
  useFocusEffect(
    useCallback(() => {
      void refresh({ force: true });
    }, [refresh])
  );
}
