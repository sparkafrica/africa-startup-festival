import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { eventRoleLabel, type EventRole } from "../utils/eventRoles";

type Props = {
  roles: EventRole[];
  compact?: boolean;
};

export default function EventRoleBadges({ roles, compact = false }: Props) {
  if (!roles.length) return null;

  return (
    <View style={styles.row}>
      {roles.map((role) => (
        <View
          key={role}
          style={[
            styles.badge,
            role === "mentor" ? styles.mentorBadge : styles.speakerBadge,
            compact && styles.badgeCompact,
          ]}
        >
          <Text
            style={[
              styles.label,
              role === "mentor" ? styles.mentorLabel : styles.speakerLabel,
              compact && styles.labelCompact,
            ]}
          >
            {eventRoleLabel(role)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  speakerBadge: {
    borderColor: "#FDBA74",
    backgroundColor: "#FFF7ED",
  },
  mentorBadge: {
    borderColor: "#6EE7B7",
    backgroundColor: "#ECFDF5",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  labelCompact: {
    fontSize: 11,
  },
  speakerLabel: {
    color: "#C2410C",
  },
  mentorLabel: {
    color: "#047857",
  },
});
