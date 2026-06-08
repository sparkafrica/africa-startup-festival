import { Alert, Linking, Platform } from "react-native";

const GOOGLE_MAPS_WEB = (encoded: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encoded}`;

/** Prefer native maps intents; fall back to HTTPS (opens app or browser). */
function mapsUrlsForAddress(address: string): string[] {
  const encoded = encodeURIComponent(address);
  if (Platform.OS === "android") {
    return [`geo:0,0?q=${encoded}`, GOOGLE_MAPS_WEB(encoded)];
  }
  return [GOOGLE_MAPS_WEB(encoded), `maps:0,0?q=${encoded}`];
}

export function googleMapsSearchUrl(address: string): string {
  return GOOGLE_MAPS_WEB(encodeURIComponent(address));
}

export async function openGoogleMapsForAddress(address: string): Promise<void> {
  const urls = mapsUrlsForAddress(address);
  await openMapsUrls(urls);
}

/** Open a direct Maps link (e.g. maps.app.goo.gl) or try fallbacks. */
export async function openMapsUrl(url: string): Promise<void> {
  await openMapsUrls([url.trim()]);
}

async function openMapsUrls(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try next fallback
    }
  }
  Alert.alert(
    "Cannot open maps",
    "Please try again or copy the address into your maps app.",
  );
}
