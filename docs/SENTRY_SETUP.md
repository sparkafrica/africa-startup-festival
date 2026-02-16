# Production Error Tracking – Sentry Setup Guide

Use this guide **after** your current OTA push. Sentry requires a new native build for both iOS and Android, so plan it for your next store release.

---

## Overview

| What | Why |
|------|-----|
| **Sentry** | Capture crashes & errors in production with readable stack traces |
| **Source maps** | See real file/line numbers instead of minified code |
| **dSYMs (iOS)** | Symbolicate native iOS crashes |
| **Mapping file (Android)** | Symbolicate native + JS Android crashes; also satisfies Google Play |

---

## Phase 1: Sentry Account & Project

1. Go to [sentry.io](https://sentry.io) → Sign up or log in
2. Create organization (if new) → Create project
3. Choose **React Native** as platform
4. Copy your **DSN** (Settings → Client Keys / DSN)
   - Format: `https://xxxxx@oxxx.ingest.sentry.io/xxxxx`
5. Create **Auth Token** (Settings → Auth Tokens):
   - Scopes: `project:releases`, `org:read`
   - Copy the token (you’ll add it to EAS secrets)

---

## Phase 2: Install Packages

Run locally (before your next build):

```bash
npx expo install @sentry/react-native
npx expo install sentry-expo
```

---

## Phase 3: Create Sentry Utility

**File:** `src/utils/sentry.ts`

```ts
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.warn("[Sentry] No DSN configured, skipping init");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false,
    debug: false,
    environment: __DEV__ ? "development" : "production",
    release: Constants.expoConfig?.extra?.eas?.projectId
      ? `spark@${Constants.expoConfig?.version ?? "1.0.0"}`
      : undefined,
    integrations: [
      // Sentry's default integrations; sentry-expo adds source map support
    ],
    tracesSampleRate: 0.2,
  });
}

export { Sentry };
```

---

## Phase 4: Wrap App with ErrorBoundary

**File:** `App.tsx`

1. At the very top (after gesture-handler import), add:
   ```ts
   import { initSentry } from "./src/utils/sentry";
   initSentry();
   ```

2. Import Sentry’s ErrorBoundary:
   ```ts
   import * as Sentry from "@sentry/react-native";
   ```

3. Wrap your root content with `Sentry.ErrorBoundary`:
   ```tsx
   <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
     <GestureHandlerRootView style={{ flex: 1 }}>
       {/* existing app content */}
     </GestureHandlerRootView>
   </Sentry.ErrorBoundary>
   ```

4. Add a simple `ErrorFallback` component that shows a message and optionally a "Retry" button.

---

## Phase 5: Add Error Logging Helper

**File:** `src/utils/logError.ts`

```ts
import * as Sentry from "@sentry/react-native";

export function logError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (__DEV__) {
    console.error(error);
    if (context) console.error("Context:", context);
  }
  Sentry.captureException(error, { extra: context ?? {} });
}
```

Then gradually replace `if (__DEV__) console.error(...)` with `logError(err, { screen: "ConnectionsScreen" })` in critical paths (api.ts, AuthContext, meeting/connection flows).

---

## Phase 6: Add API Breadcrumbs

**File:** `src/services/api.ts`

In your request interceptor (before `api.get/post/etc`):
```ts
Sentry.addBreadcrumb({
  category: "api",
  message: `${method} ${url}`,
  level: "info",
});
```

In your error handler (when request fails):
```ts
Sentry.addBreadcrumb({
  category: "api",
  message: `API Error: ${url}`,
  data: { status: statusCode, message: errorMessage },
  level: "error",
});
```

Do **not** add full request/response bodies or tokens to breadcrumbs.

---

## Phase 7: App.json Configuration

**File:** `app.json`

Add to `plugins` array:
```json
["sentry-expo", {
  "organization": "your-org-slug",
  "project": "your-project-slug"
}]
```

Or use env vars (recommended):
```json
["sentry-expo", {
  "organization": "your-org-slug",
  "project": "your-project-slug",
  "url": "https://sentry.io"
}]
```

Ensure `extra.eas.projectId` exists for release tracking.

---

## Phase 8: Environment Variables

**Option A: EAS Secrets**

```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value <your-auth-token> --scope project
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value <your-dsn> --scope project
```

**Option B: `eas.json` env**

In your production build profile:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "https://xxx@yyy.ingest.sentry.io/zzz",
        "SENTRY_ORG": "your-org",
        "SENTRY_PROJECT": "spark"
      }
    }
  }
}
```

Do **not** commit the DSN if it’s sensitive; use secrets or build-time env.

---

## Phase 9: EAS Build – Source Map Upload

**File:** `eas.json`

Add a post-build hook or use `sentry-expo`’s default behavior. `sentry-expo` plugin typically hooks into the build. Ensure your build profile has:

```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_AUTH_TOKEN": "@SENTRY_AUTH_TOKEN"
      }
    }
  }
}
```

And that `SENTRY_AUTH_TOKEN` is set in EAS secrets.

For custom upload, you can add an `eas-build-post-install` script, but `sentry-expo` usually handles it.

---

## Phase 10: Apple (dSYMs) & Google (Mapping)

- **iOS:** `sentry-expo` uploads dSYMs when building with EAS. Ensure your iOS production build completes successfully.
- **Android:** EAS produces `mapping.txt`; `sentry-expo` uploads it so Sentry can symbolicate Android crashes. Google Play will also use the mapping file if you upload builds via EAS Submit.

---

## Phase 11: Verification Checklist

After your next production build:

- [ ] App starts without Sentry-related errors
- [ ] Sentry project shows your release
- [ ] Source maps appear in Sentry (Releases → your release → Artifacts)
- [ ] Trigger a test crash (e.g. throw in a button handler) → event shows in Sentry with symbolicated stack
- [ ] Breadcrumbs show API calls leading to the error
- [ ] No PII in breadcrumbs or error metadata

---

## Build Order Summary

1. **Current OTA** – Ship base URL + notifications (no Sentry yet)
2. **Implement Sentry** – Follow Phases 1–10
3. **New native build** – `eas build --platform all --profile production`
4. **Submit to stores** – Apple App Store Connect + Google Play Console
5. **Verify** – Check Sentry dashboard for releases and test events
6. **Future OTAs** – Upload new source maps with each OTA so JS-only updates are symbolicated too

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `docs/SENTRY_SETUP.md` | ✅ Created (this file) |
| `src/utils/sentry.ts` | Create |
| `src/utils/logError.ts` | Create |
| `App.tsx` | Add init, ErrorBoundary, fallback |
| `app.json` | Add sentry-expo plugin |
| `eas.json` | Add Sentry env vars |
| `src/services/api.ts` | Add breadcrumbs + logError where appropriate |
| `.env` or EAS Secrets | Add `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

---

## Quick Reference

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [sentry-expo (Expo)](https://docs.expo.dev/guides/using-sentry/)
- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)
