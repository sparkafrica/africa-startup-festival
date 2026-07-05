/**
 * Shared profile body for scanned attendee (Android modal + iOS screen).
 */

import React from "react";
import { View, Text, Pressable, Image, Linking, Alert } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { LinkedInIcon } from "./SocialIcons";
import type { Attendee } from "../services/ticketService";
import { getAttendeeDisplayFields } from "../utils/normalizeAttendee";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";

type Props = {
  attendee: Attendee;
  /** Modal uses bordered pills; full screen uses filled neutral pills. */
  variant?: "modal" | "screen";
};

export default function ScannedAttendeeProfileContent({
  attendee,
  variant = "screen",
}: Props) {
  const display = getAttendeeDisplayFields(attendee);
  const { user } = display;
  const pillClass =
    variant === "modal"
      ? "px-3 py-1.5 bg-white border border-neutral-300 rounded-full"
      : "px-3 py-1.5 bg-neutral-100 rounded-full";
  const linkedIn = getLinkedInDisplayInfo(
    display.linkedInRaw as string | null | undefined,
  );

  return (
    <>
      <View className="flex-row items-start mb-4">
        <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center mr-4 overflow-hidden">
          {user.profile_pic ? (
            <Image
              source={{ uri: user.profile_pic }}
              className="w-full h-full"
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
        <View className="flex-1">
          <Text className="text-2xl font-bold text-black mb-1">
            {user.first_name ?? ""} {user.last_name ?? ""}
            {!user.first_name && !user.last_name ? "Unknown User" : ""}
          </Text>
          {(display.role || display.company) ? (
            <Text className="text-base text-neutral-600 mb-3">
              {display.role}
              {display.role && display.company ? " · " : ""}
              {display.company}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {display.ticketTypeName ? (
              <View className={pillClass}>
                <Text className="text-sm text-black">{display.ticketTypeName}</Text>
              </View>
            ) : null}
            {display.industry ? (
              <View className={pillClass}>
                <Text className="text-sm text-black">{display.industry}</Text>
              </View>
            ) : null}
            {display.country ? (
              <View className={pillClass}>
                <Text className="text-sm text-black">{display.country}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {display.bio ? (
        <Text className="text-base text-black leading-6 mb-6">{display.bio}</Text>
      ) : null}

      {display.interests.length > 0 ? (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-black mb-3">Interests</Text>
          <View className="flex-row flex-wrap gap-2">
            {display.interests.map((interest, index) => (
              <View key={`${interest}-${index}`} className={pillClass}>
                <Text className="text-sm text-black">{interest}</Text>
              </View>
            ))}
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
            className="flex-row items-center bg-neutral-100 rounded-full px-4 py-2.5 self-start"
          >
            <LinkedInIcon size={18} color="#0A66C2" />
            <Text className="text-sm font-medium text-neutral-900 ml-2">
              {linkedIn.displayLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
