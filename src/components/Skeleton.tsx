import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";

const SHIMMER_DURATION = 1200;
const GUIDELINE_PULSE_DURATION = 1800;

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION, easing: Easing.linear }),
      -1,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.45, 0.85, 0.45]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonListRows({
  count = 6,
  hasAvatar = true,
  style,
}: {
  count?: number;
  hasAvatar?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listRow}>
          {hasAvatar ? (
            <Skeleton width={48} height={48} borderRadius={24} />
          ) : null}
          <View style={styles.listRowContent}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} style={styles.listRowSub} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonCardGrid({
  count = 4,
  columns = 2,
  style,
}: {
  count?: number;
  columns?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const itemWidth = `${100 / columns - 2}%` as `${number}%`;

  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.gridItem, { width: itemWidth }]}>
          <Skeleton width="100%" height={72} borderRadius={12} />
          <Skeleton width="80%" height={12} style={styles.gridLabel} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonSpeakerGrid({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.speakerGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.speakerItem}>
          <Skeleton width={96} height={96} borderRadius={48} />
          <Skeleton width={80} height={12} style={styles.speakerName} />
          <Skeleton width={64} height={10} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonScheduleList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.scheduleRow}>
          <Skeleton width={56} height={14} />
          <View style={styles.scheduleContent}>
            <Skeleton width="85%" height={14} />
            <Skeleton width="55%" height={12} style={styles.listRowSub} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonMessageList({ count = 8 }: { count?: number }) {
  return <SkeletonListRows count={count} hasAvatar />;
}

export function SkeletonAppShell() {
  return (
    <View style={styles.appShell}>
      <Skeleton width="100%" height={180} borderRadius={16} />
      <Skeleton width="55%" height={20} style={styles.appShellTitle} />
      <SkeletonCardGrid count={4} />
      <Skeleton width="100%" height={120} borderRadius={16} style={styles.appShellBlock} />
    </View>
  );
}

/** Home directory card only — full-area guideline texture, no placeholder boxes. */
export function HomeDirectorySkeleton({
  style,
  minHeight = 360,
  fullScreen = false,
}: {
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
  /** Fills the viewport (e.g. AppNavigator auth bootstrap before Home mounts). */
  fullScreen?: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: GUIDELINE_PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.homeDirectorySkeleton,
        fullScreen ? styles.homeDirectoryFullScreen : { minHeight },
        animatedStyle,
        style,
      ]}
    >
      <GuidelinePatternOverlay opacity={fullScreen ? 0.08 : 0.07} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E5E5E5",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  listRowContent: {
    flex: 1,
  },
  listRowSub: {
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    marginBottom: 8,
  },
  gridLabel: {
    marginTop: 10,
    alignSelf: "center",
  },
  speakerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    gap: 16,
  },
  speakerItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 20,
  },
  speakerName: {
    marginTop: 10,
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  scheduleContent: {
    flex: 1,
  },
  appShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  appShellTitle: {
    marginTop: 20,
    marginBottom: 16,
  },
  appShellBlock: {
    marginTop: 16,
  },
  homeDirectorySkeleton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  homeDirectoryFullScreen: {
    flex: 1,
    borderRadius: 0,
  },
});
