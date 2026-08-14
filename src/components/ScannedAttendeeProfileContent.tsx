/**
 * Shared profile body for scanned attendee (modal sheet + full screen).
 */

import React from "react";
import { View, Text, Pressable, Image, Linking, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle } from "react-native-svg";
import { LinkedInLinkLabel } from "./LinkedInLinkLabel";
import { Skeleton } from "./Skeleton";
import type { Attendee } from "../services/ticketService";
import { getAttendeeDisplayFields } from "../utils/normalizeAttendee";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import {
  getTicketGradientColors,
  getTicketTypeDisplay,
  isLightTicketCard,
} from "../utils/ticketColors";

type Props = {
  attendee: Attendee;
  /** Modal uses bordered pills; full screen uses filled neutral pills. */
  variant?: "modal" | "screen";
  /** Directory enrich still in flight — show subtle skeleton placeholders. */
  isEnriching?: boolean;
  /** Modal sheet close — X aligns with the attendee name row. */
  onClose?: () => void;
};

function CloseIcon({ size = 22, color = "#171717" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PassTypeBadge({ ticketTypeName }: { ticketTypeName: string }) {
  const { label } = getTicketTypeDisplay(ticketTypeName);
  const gradient = getTicketGradientColors(ticketTypeName);
  const light = isLightTicketCard(ticketTypeName);

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.passBadge}
    >
      <Text style={[styles.passBadgeText, light ? styles.passBadgeTextDark : styles.passBadgeTextLight]}>
        {label}
      </Text>
    </LinearGradient>
  );
}

export default function ScannedAttendeeProfileContent({
  attendee,
  variant = "screen",
  isEnriching = false,
  onClose,
}: Props) {
  const display = getAttendeeDisplayFields(attendee);
  const { user } = display;
  const pillStyle = variant === "modal" ? styles.pillModal : styles.pillScreen;
  const linkedIn = getLinkedInDisplayInfo(
    display.linkedInRaw as string | null | undefined,
  );
  const fullName =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown User";
  const showHeaderClose = variant === "modal" && !!onClose;

  return (
    <>
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            {user.profile_pic ? (
              <Image
                source={{ uri: user.profile_pic }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" fill="#000000" />
                <Path
                  d="M6 21C6 17.134 9.13401 14 13 14C16.866 14 20 17.134 20 21"
                  stroke="#000000"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            )}
          </View>
          <View style={styles.headerTextCol}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={3}>
                {fullName}
              </Text>
              {showHeaderClose ? (
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={styles.headerClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile"
                >
                  <CloseIcon />
                </Pressable>
              ) : null}
            </View>
            {(display.role || display.company) ? (
              <Text style={styles.subtitle}>
                {display.role}
                {display.role && display.company ? " · " : ""}
                {display.company}
              </Text>
            ) : null}
          </View>
        </View>

        {(display.ticketTypeName || display.industry || display.country) ? (
          <View style={styles.pillsRow}>
            {display.ticketTypeName ? (
              <PassTypeBadge ticketTypeName={display.ticketTypeName} />
            ) : null}
            {display.industry ? (
              <View style={pillStyle}>
                <Text style={styles.pillText}>{display.industry}</Text>
              </View>
            ) : null}
            {display.country ? (
              <View style={pillStyle}>
                <Text style={styles.pillText}>{display.country}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isEnriching ? (
          <Text style={styles.enrichingHint}>Updating profile…</Text>
        ) : null}
      </View>

      {display.bio ? (
        <Text className="text-base text-black leading-6 mb-6">{display.bio}</Text>
      ) : isEnriching ? (
        <View className="mb-6">
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="88%" height={14} />
        </View>
      ) : null}

      {display.interests.length > 0 ? (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-black mb-3">Interests</Text>
          <View className="flex-row flex-wrap gap-2">
            {display.interests.map((interest, index) => (
              <View key={`${interest}-${index}`} style={pillStyle}>
                <Text style={styles.pillText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : isEnriching ? (
        <View className="mb-6">
          <Skeleton width={100} height={18} style={{ marginBottom: 12 }} />
          <View className="flex-row flex-wrap gap-2">
            <Skeleton width={88} height={32} borderRadius={0} />
            <Skeleton width={104} height={32} borderRadius={0} />
            <Skeleton width={72} height={32} borderRadius={0} />
          </View>
        </View>
      ) : null}

      {linkedIn ? (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-black mb-3">Social Links</Text>
          <Pressable
            onPress={async () => {
              try {
                const supported = await Linking.canOpenURL(linkedIn.url);
                if (supported) {
                  await Linking.openURL(linkedIn.url);
                } else {
                  try {
                    await Linking.openURL(linkedIn.url);
                  } catch {
                    Alert.alert(
                      "Cannot Open LinkedIn",
                      "Please try opening the link in your browser.",
                    );
                  }
                }
              } catch {
                Alert.alert(
                  "Error",
                  "Failed to open LinkedIn profile. Please try again.",
                );
              }
            }}
            style={styles.linkedInBtn}
          >
            <LinkedInLinkLabel />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 28,
  },
  headerClose: {
    width: 44,
    height: 44,
    marginTop: -6,
    marginRight: -6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 16,
    color: "#525252",
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  passBadge: {
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  passBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  passBadgeTextDark: {
    color: "#171717",
  },
  passBadgeTextLight: {
    color: "#FFFFFF",
  },
  enrichingHint: {
    fontSize: 12,
    color: "#A3A3A3",
    marginTop: 8,
  },
  pillModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D4D4D4",
    borderRadius: 0,
  },
  pillScreen: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F5F5",
    borderRadius: 0,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#404040",
  },
  linkedInBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
