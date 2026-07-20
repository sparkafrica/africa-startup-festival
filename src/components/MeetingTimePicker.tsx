import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { generateTimeOptions } from "../utils/meetingDateTime";

interface MeetingTimePickerProps {
  selectedTimeApi: string | null;
  onSelectTime: (display: string, apiValue: string) => void;
  intervalMinutes?: number;
  startHour?: number;
  endHour?: number;
}

export default function MeetingTimePicker({
  selectedTimeApi,
  onSelectTime,
  intervalMinutes = 15,
  startHour = 8,
  endHour = 21,
}: MeetingTimePickerProps) {
  const options = useMemo(
    () => generateTimeOptions(intervalMinutes, startHour, endHour),
    [intervalMinutes, startHour, endHour],
  );

  return (
    <ScrollView
      style={styles.scroll}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator
    >
      {options.map((opt) => {
        const selected = selectedTimeApi === opt.apiValue;
        return (
          <Pressable
            key={opt.id}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onSelectTime(opt.label, opt.apiValue)}
          >
            <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
              {opt.label}
            </Text>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 220,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  rowSelected: {
    backgroundColor: "#F0FDF4",
  },
  rowText: {
    fontSize: 16,
    color: "#171717",
  },
  rowTextSelected: {
    fontWeight: "600",
    color: "#166534",
  },
  check: {
    fontSize: 16,
    color: "#1BB273",
    fontWeight: "700",
  },
});
