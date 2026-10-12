import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  compact?: boolean;
};

/** Shared role badge for people linked to an ASF speaker ticket/profile. */
export default function SpeakerBadge({ compact = false }: Props) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>Speaker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderColor: "#FDBA74",
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "700",
  },
  labelCompact: {
    fontSize: 11,
  },
});
