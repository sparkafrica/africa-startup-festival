/**
 * Expo app config. Loads .env and injects EXPO_PUBLIC_SPARK_API_KEY into
 * expo.extra.SPARK_API_KEY so the app can read it at runtime without
 * committing the key. .env is in .gitignore.
 */
require("dotenv").config();

const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      SPARK_API_KEY: process.env.EXPO_PUBLIC_SPARK_API_KEY || "",
      // Upgrade ticket: backend requires new_ticket_class_id per tier. Set in .env (get IDs from backend).
      UPGRADE_CLASS_ID_OASIS: process.env.EXPO_PUBLIC_UPGRADE_CLASS_ID_OASIS
        ? parseInt(process.env.EXPO_PUBLIC_UPGRADE_CLASS_ID_OASIS, 10)
        : undefined,
      UPGRADE_CLASS_ID_DELEGATE: process.env
        .EXPO_PUBLIC_UPGRADE_CLASS_ID_DELEGATE
        ? parseInt(process.env.EXPO_PUBLIC_UPGRADE_CLASS_ID_DELEGATE, 10)
        : undefined,
      UPGRADE_CLASS_ID_CHAIRPERSON: process.env
        .EXPO_PUBLIC_UPGRADE_CLASS_ID_CHAIRPERSON
        ? parseInt(process.env.EXPO_PUBLIC_UPGRADE_CLASS_ID_CHAIRPERSON, 10)
        : undefined,
      UPGRADE_PAYMENT_METHOD:
        process.env.EXPO_PUBLIC_UPGRADE_PAYMENT_METHOD || "PAYSTACK",
      UPGRADE_CURRENCY: process.env.EXPO_PUBLIC_UPGRADE_CURRENCY || "NGN",
      /** Africa Technology Expo on the App Store — override with EXPO_PUBLIC_IOS_APP_STORE_ID if needed. */
      iosAppStoreId:
        process.env.EXPO_PUBLIC_IOS_APP_STORE_ID || "6757281613",
    },
  },
};
