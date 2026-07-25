/**
 * Expo app config. Loads .env and injects keys into expo.extra for runtime.
 * .env is in .gitignore.
 */
require("dotenv").config();

const appJson = require("./app.json");

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  "https://6d2988428ac71006e30474e87bcf9d04@o4511019946213376.ingest.de.sentry.io/4511683841687632";

const CUSTOMERIO_CDP_API_KEY =
  process.env.EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY || "";
const CUSTOMERIO_SITE_ID = process.env.EXPO_PUBLIC_CUSTOMERIO_SITE_ID || "";
const CUSTOMERIO_REGION = (
  process.env.EXPO_PUBLIC_CUSTOMERIO_REGION || "us"
).toLowerCase();

const IOS_BUNDLE_ID = appJson.expo.ios?.bundleIdentifier || "com.sparkllc.asf";

/** @type {import('expo/config').ExpoConfig['plugins']} */
const plugins = (appJson.expo.plugins || []).map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === "expo-build-properties") {
    return [
      "expo-build-properties",
      {
        ...plugin[1],
        ios: {
          ...plugin[1]?.ios,
          deploymentTarget: "15.1",
        },
      },
    ];
  }
  return plugin;
});

plugins.push([
  "customerio-expo-plugin",
  {
    android: {
      googleServicesFile: "./google-services.json",
    },
    ios: {
      useFrameworks: "static",
      ...(process.env.EXPO_PUBLIC_APPLE_TEAM_ID
        ? { appleTeamId: process.env.EXPO_PUBLIC_APPLE_TEAM_ID }
        : {}),
      pushNotification: {
        provider: "fcm",
        useRichPush: true,
        autoFetchDeviceToken: false,
        disableNotificationRegistration: true,
        ...(CUSTOMERIO_CDP_API_KEY
          ? {
              env: {
                cdpApiKey: CUSTOMERIO_CDP_API_KEY,
                region: CUSTOMERIO_REGION,
              },
            }
          : {}),
      },
    },
  },
]);

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo.extra,
      SPARK_API_KEY: process.env.EXPO_PUBLIC_SPARK_API_KEY || "",
      SENTRY_DSN,
      iosAppStoreId: process.env.EXPO_PUBLIC_IOS_APP_STORE_ID || "",
      CUSTOMERIO_CDP_API_KEY,
      CUSTOMERIO_SITE_ID,
      CUSTOMERIO_REGION,
      eas: {
        ...appJson.expo.extra?.eas,
        build: {
          ...appJson.expo.extra?.eas?.build,
          experimental: {
            ios: {
              appExtensions: [
                {
                  targetName: "NotificationService",
                  bundleIdentifier: `${IOS_BUNDLE_ID}.richpush`,
                  entitlements: {
                    "com.apple.developer.usernotifications.service": true,
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
};
