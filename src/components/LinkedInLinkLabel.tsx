import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinkedInIcon } from "./SocialIcons";
import { ChevronRightIcon } from "./icons";
import { LINKEDIN_DISPLAY_LABEL } from "../utils/linkedInUtils";

/** Shared optical nudge — same on iOS and Android so the row stays in parity. */
const LABEL_NUDGE_Y = 3;

/**
 * Icon + "LinkedIn" + chevron.
 * Text and chevron share one transform so they cannot drift apart across platforms.
 */
export function LinkedInLinkLabel({
  iconSize = 18,
  textSize = 14,
  textColor = "#171717",
  chevronColor = "#737373",
  fontWeight = "500",
}: {
  iconSize?: number;
  textSize?: number;
  textColor?: string;
  chevronColor?: string;
  fontWeight?: "500" | "600";
}) {
  return (
    <View style={styles.row}>
      <LinkedInIcon size={iconSize} color="#0A66C2" />
      <View style={styles.labelGroup}>
        <Text
          style={[
            styles.label,
            {
              fontSize: textSize,
              lineHeight: textSize + 2,
              color: textColor,
              fontWeight,
            },
          ]}
        >
          {LINKEDIN_DISPLAY_LABEL}
        </Text>
        <ChevronRightIcon size={textSize + 2} color={chevronColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
    transform: [{ translateY: LABEL_NUDGE_Y }],
  },
  label: {
    includeFontPadding: false,
    textAlignVertical: "center",
    marginRight: 2,
  },
});
