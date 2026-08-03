import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  addDaysToIso,
  buildMonthGrid,
  compareIso,
  formatMonthYear,
  listMonthsBetween,
  parseDateIso,
  todayIsoLocal,
  WEEKDAY_LABELS,
  type CalendarCell,
} from "../utils/meetingDateTime";

interface MeetingCalendarPickerProps {
  selectedDateIso: string | null;
  onSelectDate: (iso: string) => void;
  minDateIso?: string;
  maxDateIso?: string;
  /** When set, only these ISO dates are selectable (e.g. physical slot days). */
  enabledDatesIso?: Set<string> | null;
}

function resolveMonthRange(
  minDateIso: string,
  maxDateIso: string | undefined,
  enabledDatesIso: Set<string> | null,
): { year: number; month: number }[] {
  let rangeEnd = maxDateIso;
  if (!rangeEnd && enabledDatesIso && enabledDatesIso.size > 0) {
    const sorted = Array.from(enabledDatesIso).sort(compareIso);
    rangeEnd = sorted[sorted.length - 1];
  }
  if (!rangeEnd) {
    rangeEnd = addDaysToIso(minDateIso, 90);
  }
  if (compareIso(rangeEnd, minDateIso) < 0) {
    rangeEnd = minDateIso;
  }
  return listMonthsBetween(minDateIso, rangeEnd);
}

function MonthGrid({
  year,
  month,
  selectedDateIso,
  minDateIso,
  maxDateIso,
  enabledDatesIso,
  onSelectDate,
}: {
  year: number;
  month: number;
  selectedDateIso: string | null;
  minDateIso: string;
  maxDateIso?: string;
  enabledDatesIso: Set<string> | null;
  onSelectDate: (iso: string) => void;
}) {
  const cells = useMemo(
    () => buildMonthGrid(year, month),
    [year, month],
  );

  const isSelectable = (iso: string, inMonth: boolean) => {
    if (!inMonth) return false;
    if (compareIso(iso, minDateIso) < 0) return false;
    if (maxDateIso && compareIso(iso, maxDateIso) > 0) return false;
    if (enabledDatesIso && !enabledDatesIso.has(iso)) return false;
    return true;
  };

  return (
    <View style={styles.grid}>
      {cells.map((cell: CalendarCell) => {
        const selectable = isSelectable(cell.iso, cell.inMonth);
        const selected = selectedDateIso === cell.iso;
        return (
          <Pressable
            key={`${cell.iso}-${cell.inMonth}`}
            disabled={!selectable}
            onPress={() => onSelectDate(cell.iso)}
            style={styles.dayCell}
          >
            <View
              style={[
                styles.dayCellInner,
                selected && styles.dayCellInnerSelected,
                selectable && !selected && styles.dayCellInnerSelectable,
                !cell.inMonth && styles.dayCellInnerOutside,
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
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MeetingCalendarPicker({
  selectedDateIso,
  onSelectDate,
  minDateIso = todayIsoLocal(),
  maxDateIso,
  enabledDatesIso = null,
}: MeetingCalendarPickerProps) {
  const months = useMemo(
    () => resolveMonthRange(minDateIso, maxDateIso, enabledDatesIso),
    [minDateIso, maxDateIso, enabledDatesIso],
  );

  const initialIndex = useMemo(() => {
    const anchor = selectedDateIso ?? minDateIso;
    const { y, m } = parseDateIso(anchor);
    const idx = months.findIndex((mo) => mo.year === y && mo.month === m);
    return idx >= 0 ? idx : 0;
  }, [months, minDateIso, selectedDateIso]);

  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== pageWidth) setPageWidth(w);
  }, [pageWidth]);

  useEffect(() => {
    if (pageWidth <= 0 || didInitialScroll.current) return;
    didInitialScroll.current = true;
    setActiveIndex(initialIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: initialIndex * pageWidth,
        animated: false,
      });
    });
  }, [initialIndex, pageWidth]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const clamped = Math.max(0, Math.min(months.length - 1, idx));
    setActiveIndex(clamped);
  };

  const activeMonth = months[activeIndex] ?? months[0];

  return (
    <View style={styles.root} onLayout={onLayout}>
      <Text style={styles.monthLabel}>
        {activeMonth
          ? formatMonthYear(activeMonth.year, activeMonth.month)
          : ""}
      </Text>

      {months.length > 1 ? (
        <Text style={styles.swipeHint}>Swipe left or right for other months</Text>
      ) : null}

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {pageWidth > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          contentContainerStyle={{ width: pageWidth * months.length }}
        >
          {months.map(({ year, month }) => (
            <View
              key={`${year}-${month}`}
              style={{ width: pageWidth }}
            >
              <MonthGrid
                year={year}
                month={month}
                selectedDateIso={selectedDateIso}
                minDateIso={minDateIso}
                maxDateIso={maxDateIso}
                enabledDatesIso={enabledDatesIso}
                onSelectDate={onSelectDate}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        activeMonth ? (
          <MonthGrid
            year={activeMonth.year}
            month={activeMonth.month}
            selectedDateIso={selectedDateIso}
            minDateIso={minDateIso}
            maxDateIso={maxDateIso}
            enabledDatesIso={enabledDatesIso}
            onSelectDate={onSelectDate}
          />
        ) : null
      )}

      {months.length > 1 ? (
        <View style={styles.dotsRow}>
          {months.map((mo, i) => (
            <View
              key={`${mo.year}-${mo.month}-dot`}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#171717",
    textAlign: "center",
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 11,
    color: "#A3A3A3",
    textAlign: "center",
    marginBottom: 8,
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
  },
  dayCellInner: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  dayCellInnerSelectable: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  dayCellInnerSelected: {
    backgroundColor: "#171717",
    borderWidth: 2,
    borderColor: "#171717",
  },
  dayCellInnerOutside: {
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
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D4D4D4",
  },
  dotActive: {
    backgroundColor: "#171717",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
