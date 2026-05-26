import { useCallback, useRef, useState } from "react";
import { Animated, type View } from "react-native";

/** Visible pulse duration before fade (matches product spec for deeplinks). */
export const LIST_HIGHLIGHT_PULSE_MS = 3000;
export const LIST_HIGHLIGHT_FADE_MS = 350;
export const ESTIMATED_LIST_ROW_HEIGHT = 140;

export function useListRowHighlight<TId extends string | number>() {
  const highlightTimersRef = useRef<{
    scroll?: ReturnType<typeof setTimeout>;
    fade?: ReturnType<typeof setTimeout>;
  }>({});
  const highlightRunIdRef = useRef(0);
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const [pulseId, setPulseId] = useState<TId | null>(null);
  const [highlightTargetId, setHighlightTargetId] = useState<TId | null>(null);
  const rowLayoutRef = useRef(
    new Map<TId, { y: number; height: number }>(),
  );
  const rowViewRefs = useRef(new Map<TId, View>());
  const listContentRef = useRef<View>(null);
  const scrollViewportHeightRef = useRef(400);
  const scrollToOffsetRef = useRef<((y?: number) => void) | null>(null);

  const clearHighlightTimers = useCallback(() => {
    const timers = highlightTimersRef.current;
    if (timers.scroll) clearTimeout(timers.scroll);
    if (timers.fade) clearTimeout(timers.fade);
    highlightTimersRef.current = {};
  }, []);

  const clearHighlight = useCallback(() => {
    clearHighlightTimers();
    highlightRunIdRef.current += 1;
    setHighlightTargetId(null);
    highlightOpacity.stopAnimation();
    highlightOpacity.setValue(0);
    setPulseId(null);
  }, [clearHighlightTimers, highlightOpacity]);

  const startPulse = useCallback(
    (id: TId) => {
      clearHighlightTimers();
      const runId = ++highlightRunIdRef.current;
      setPulseId(id);
      highlightOpacity.setValue(1);

      highlightTimersRef.current.fade = setTimeout(() => {
        if (highlightRunIdRef.current !== runId) return;
        Animated.timing(highlightOpacity, {
          toValue: 0,
          duration: LIST_HIGHLIGHT_FADE_MS,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished && highlightRunIdRef.current === runId) {
            setPulseId(null);
          }
        });
      }, LIST_HIGHLIGHT_PULSE_MS);
    },
    [clearHighlightTimers, highlightOpacity],
  );

  const measureRowLayout = useCallback((id: TId, node: View | null) => {
    const container = listContentRef.current;
    if (!node || !container) return;
    node.measureLayout(
      container,
      (_x, y, _w, height) => {
        rowLayoutRef.current.set(id, { y, height });
      },
      () => {},
    );
  }, []);

  const scrollToCenteredRow = useCallback((id: TId) => {
    const layout = rowLayoutRef.current.get(id);
    const viewportH = scrollViewportHeightRef.current;
    const scrollTo = scrollToOffsetRef.current;
    if (!layout || !scrollTo) return false;
    const centeredY = Math.max(0, layout.y + layout.height / 2 - viewportH / 2);
    scrollTo(centeredY);
    return true;
  }, []);

  const tryScrollAndHighlight = useCallback(
    (id: TId, listIndex: number, attempt = 0) => {
      let scrolled = scrollToCenteredRow(id);
      if (!scrolled && listIndex >= 0 && attempt >= 4) {
        const viewportH = scrollViewportHeightRef.current;
        const y = Math.max(
          0,
          listIndex * ESTIMATED_LIST_ROW_HEIGHT +
            ESTIMATED_LIST_ROW_HEIGHT / 2 -
            viewportH / 2,
        );
        scrollToOffsetRef.current?.(y);
        scrolled = true;
      }

      if (!scrolled && attempt < 16) {
        highlightTimersRef.current.scroll = setTimeout(
          () => tryScrollAndHighlight(id, listIndex, attempt + 1),
          80,
        );
        return;
      }

      startPulse(id);
    },
    [scrollToCenteredRow, startPulse],
  );

  const queueHighlight = useCallback(
    (id: TId, findIndex: () => number) => {
      rowLayoutRef.current.clear();
      rowViewRefs.current.clear();
      setHighlightTargetId(id);
      return { findIndex };
    },
    [],
  );

  const isHighlighted = useCallback(
    (id: TId) => pulseId === id,
    [pulseId],
  );

  const highlightOverlayStyle = useCallback(
    (id: TId) => ({
      opacity: pulseId === id ? highlightOpacity : 0,
    }),
    [pulseId, highlightOpacity],
  );

  return {
    highlightTargetId,
    setHighlightTargetId,
    clearHighlight,
    clearHighlightTimers,
    tryScrollAndHighlight,
    queueHighlight,
    isHighlighted,
    highlightOpacity,
    highlightOverlayStyle,
    measureRowLayout,
    rowViewRefs,
    listContentRef,
    scrollViewportHeightRef,
    scrollToOffsetRef,
    rowLayoutRef,
  };
}
