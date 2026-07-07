# ASF universal links server

Serves **Apple App Site Association** and **Android Asset Links** for:

`https://app.africastartupfestival.com`

## App identity

| Platform | Value |
|----------|--------|
| iOS bundle | `com.sparkllc.asf` |
| Android package | `com.sparkllc.asf` |
| Apple Team ID | `6635QUGDA7` |
| AASA app ID | `6635QUGDA7.com.sparkllc.asf` |

## Android SHA-256 fingerprints

Edit `well-known/assetlinks.json` and replace the placeholders with:

1. **EAS upload key** — after `eas build -p android --profile production`:
   ```bash
   eas credentials -p android
   ```
   Copy the SHA-256 fingerprint for the upload keystore.

2. **Google Play App Signing key** — Play Console → your app → **App integrity** → **App signing key certificate**.

Include both fingerprints if Play App Signing re-signs your APK/AAB.

## Deploy

DNS must point `app.africastartupfestival.com` to the host running this service.

```bash
bun install
bun run index.ts
```

Docker / Swarm deploy uses `.github/workflows/deploy.yml`. Update the Docker service name on the server from `ate-deeplink_app` to `asf-deeplink_app` (or your ASF stack name) before the first ASF deploy.

Optional env vars:

- `ASF_APP_STORE_URL` — full App Store URL once the listing exists
- `ASF_PLAY_STORE_URL` — defaults to `com.sparkllc.asf` Play Store page
- `PORT` — default `3000`

## Verify

```bash
curl -s https://app.africastartupfestival.com/.well-known/apple-app-site-association | jq .
curl -s https://app.africastartupfestival.com/.well-known/assetlinks.json | jq .
```

iOS: open `https://app.africastartupfestival.com/meetings` on a device with the production ASF build installed.

Android: [Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator)
