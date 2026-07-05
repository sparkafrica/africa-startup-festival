import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  buildMonthGrid,
  compareIso,
  formatMonthYear,
  parseDateIso,
  shiftMonth,
  todayIsoLocal,
  WEEKDAY_LABELS,
} from "../utils/meetingDateTime";

interface MeetingCalendarPickerProps {
  selectedDateIso: string | null;
  onSelectDate: (iso: string) => void;
  minDateIso?: string;
  maxDateIso?: string;
  /** When set, only these ISO dates are selectable (e.g. physical slot days). */
  enabledDatesIso?: Set<string> | null;
}

export default function MeetingCalendarPicker({
  selectedDateIso,
  onSelectDate,
  minDateIso = todayIsoLocal(),
  maxDateIso,
  enabledDatesIso = null,
}: MeetingCalendarPickerProps) {
  const initial = selectedDateIso
    ? parseDateIso(selectedDateIso)
    : parseDateIso(minDateIso);
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const isSelectable = (iso: string, inMonth: boolean) => {
    if (!inMonth) return false;
    if (compareIso(iso, minDateIso) < 0) return false;
    if (maxDateIso && compareIso(iso, maxDateIso) > 0) return false;
    if (enabledDatesIso && !enabledDatesIso.has(iso)) return false;
    return true;
  };

  const goPrev = () => {
    const next = shiftMonth(viewYear, viewMonth, -1);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const goNext = () => {
    const next = shiftMonth(viewYear, viewMonth, 1);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {formatMonthYear(viewYear, viewMonth)}
        </Text>
        <Pressable onPress={goNext} style={styles.navBtn} hitSlop={8}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const selectable = isSelectable(cell.iso, cell.inMonth);
          const selected = selectedDateIso === cell.iso;
          return (
            <Pressable
              key={`${cell.iso}-${cell.inMonth}`}
              disabled={!selectable}
              onPress={() => onSelectDate(cell.iso)}
              style={[
                styles.dayCell,
                selected && styles.dayCellSelected,
                !cell.inMonth && styles.dayCellOutside,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  !cell.inMonth && styles.dayTextOutside,
                  !selectable && styles.dayTextDisabled,
                  selected && styles.dayTextSelected,
                ]}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
  },
  navText: {
    fontSize: 22,
    color: "#171717",
    lineHeight: 24,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#171717",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#A3A3A3",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  dayCellSelected: {
    backgroundColor: "#171717",
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 14,
    color: "#171717",
    fontWeight: "500",
  },
  dayTextOutside: {
    color: "#A3A3A3",
  },
  dayTextDisabled: {
    color: "#D4D4D4",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
