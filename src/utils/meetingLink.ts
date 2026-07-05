import { Alert, Linking } from "react-native";

export function formatMeetingUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function openMeetingLink(url: string): Promise<void> {
  const formattedUrl = formatMeetingUrl(url);
  if (!formattedUrl) return;

  try {
    const supported = await Linking.canOpenURL(formattedUrl);
    if (supported) {
      await Linking.openURL(formattedUrl);
      return;
    }
    try {
      await Linking.openURL(formattedUrl);
    } catch {
      Alert.alert(
        "Cannot Open Meeting Link",
        "Please check the meeting link and try again.",
        [{ text: "OK" }],
      );
    }
  } catch (error) {
    if (__DEV__) {
      console.error("Error opening meeting link:", error);
    }
    Alert.alert("Error", "Failed to open meeting link. Please try again.", [
      { text: "OK" },
    ]);
  }
}

export function resolveVirtualMeetingLink(
  meetingLink?: string | null,
  metadata?: { meetingLink?: unknown } | null,
): string | undefined {
  const topLevel = typeof meetingLink === "string" ? meetingLink.trim() : "";
  if (topLevel) return topLevel;

  const fromMetadata =
    typeof metadata?.meetingLink === "string"
      ? metadata.meetingLink.trim()
      : "";
  return fromMetadata || undefined;
}
