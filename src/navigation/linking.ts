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
        Attendees: {
          path: "attendees/:highlightUserId?",
          parse: {
            highlightUserId: (value: string) =>
              value ? decodeURIComponent(value) : undefined,
          },
        },
        Schedule: {
          path: "schedule/:highlightScheduleId?",
          parse: {
            highlightScheduleId: (value: string) => {
              const n = parseInt(value, 10);
              return Number.isFinite(n) && n > 0 ? n : undefined;
            },
          },
        },
        Profile: "profile",
        TagPickup: "tag-pickup",
        Connections: {
          path: "connections/:highlightConnectionId?",
          parse: {
            highlightConnectionId: (value: string) => {
              const n = parseInt(value, 10);
              return Number.isFinite(n) && n > 0 ? n : undefined;
            },
          },
        },
        Exhibitors: {
          path: "exhibitors/:highlightCompanyId?",
          parse: {
            highlightCompanyId: (value: string) =>
              value ? decodeURIComponent(value) : undefined,
          },
        },
        Partners: {
          path: "partners/:highlightCompanyId?",
          parse: {
            highlightCompanyId: (value: string) =>
              value ? decodeURIComponent(value) : undefined,
          },
        },
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
