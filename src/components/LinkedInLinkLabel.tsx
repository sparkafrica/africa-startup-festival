import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinkedInIcon } from "./SocialIcons";
import { ChevronRightIcon } from "./icons";
import { LINKEDIN_DISPLAY_LABEL } from "../utils/linkedInUtils";

/**
 * Icon + "LinkedIn" + chevron, optically centered.
 * "LinkedIn" has no descenders so RN centers the line-box, not the glyphs —
 * we nudge the label down to sit with the SVGs.
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
  const slot = Math.max(iconSize, 20);
  return (
    <View style={[styles.row, { height: slot }]}>
      <View style={[styles.slot, { width: iconSize, height: slot }]}>
        <LinkedInIcon size={iconSize} color="#0A66C2" />
      </View>
      <View style={[styles.slot, { height: slot, marginLeft: 6, marginRight: 2 }]}>
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
      </View>
      <View style={[styles.slot, { width: slot, height: slot }]}>
        <ChevronRightIcon size={slot} color={chevronColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  slot: {
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    includeFontPadding: false,
    textAlignVertical: "center",
    // No descenders in "LinkedIn" — glyphs sit high in the line box.
    transform: [{ translateY: Platform.OS === "ios" ? 2 : 1 }],
  },
});
