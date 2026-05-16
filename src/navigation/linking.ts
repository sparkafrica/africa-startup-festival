/**
 * React Navigation universal / app links (email digest CTAs).
 */
import { Linking } from "react-native";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import { DEEP_LINK_PREFIXES } from "../config/deeplink";
import { capturePendingDeeplink } from "../utils/pendingDeeplink";
import {
  getNavigationStateFromDeepLinkPath,
  isDeepLinkUrl,
  isHandledDeepLinkPath,
  normalizeDeepLinkPath,
} from "./deepLinkRoutes";

export function createLinkingConfig(enabled: boolean): LinkingOptions<RootStackParamList> {
  return {
    prefixes: [...DEEP_LINK_PREFIXES],

    config: {
      screens: {
        Home: "",
        Attendees: "attendees",
        Connections: "connections",
        Meetings: {
          path: "meetings/:segment?",
          parse: {
            segment: (value: string) => value,
          },
        },
      },
    },

    getStateFromPath(path, options) {
      return getNavigationStateFromDeepLinkPath(path, options);
    },

    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (!url || !isDeepLinkUrl(url)) return url;

      const path = normalizeDeepLinkPath(url);
      if (!isHandledDeepLinkPath(path)) return null;

      if (!enabled) {
        capturePendingDeeplink(url);
        return null;
      }

      return url;
    },

    subscribe(listener) {
      const onReceive = (event: { url: string }) => {
        const { url } = event;
        if (!isDeepLinkUrl(url)) {
          listener(url);
          return;
        }
        const path = normalizeDeepLinkPath(url);
        if (!isHandledDeepLinkPath(path)) return;

        if (!enabled) {
          capturePendingDeeplink(url);
          return;
        }
        listener(url);
      };

      const subscription = Linking.addEventListener("url", onReceive);
      return () => subscription.remove();
    },
  };
}
