import React from "react";
import { Text, StyleSheet, Platform } from "react-native";
import { LinkedInIcon } from "./SocialIcons";
import { ChevronRightIcon } from "./icons";
import { LINKEDIN_DISPLAY_LABEL } from "../utils/linkedInUtils";

/**
 * Icon + "LinkedIn" + chevron on one visual baseline.
 * Keep parent as a row with alignItems: "center".
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
  const rowSize = Math.max(iconSize, 18);
  return (
    <>
      <LinkedInIcon size={iconSize} color="#0A66C2" />
      <Text
        style={[
          styles.label,
          {
            fontSize: textSize,
            lineHeight: rowSize,
            height: rowSize,
            color: textColor,
            fontWeight,
          },
        ]}
      >
        {LINKEDIN_DISPLAY_LABEL}
      </Text>
      <ChevronRightIcon size={rowSize} color={chevronColor} />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    includeFontPadding: false,
    textAlignVertical: "center",
    paddingTop: Platform.OS === "ios" ? 1 : 0,
    marginLeft: 6,
    marginRight: 2,
  },
});
