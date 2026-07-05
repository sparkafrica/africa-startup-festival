/**
 * Expo app config. Loads .env and injects EXPO_PUBLIC_SPARK_API_KEY into
 * expo.extra.SPARK_API_KEY so the app can read it at runtime without
 * committing the key. .env is in .gitignore.
 */
require("dotenv").config();

const appJson = require("./app.json");

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  "https://6d2988428ac71006e30474e87bcf9d04@o4511019946213376.ingest.de.sentry.io/4511683841687632";

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      SPARK_API_KEY: process.env.EXPO_PUBLIC_SPARK_API_KEY || "",
      SENTRY_DSN,
      /** Africa Startup Festival on the App Store — override with EXPO_PUBLIC_IOS_APP_STORE_ID if needed. */
      iosAppStoreId: process.env.EXPO_PUBLIC_IOS_APP_STORE_ID || "",
    },
  },
};
