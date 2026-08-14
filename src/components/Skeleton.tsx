import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
const SHIMMER_DURATION = 1200;
/** ASF cards use pointed corners; avatars stay circular. */
const SKELETON_SQUARE = 0;

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
  itemBorderRadius = 12,
  itemHeight = 72,
}: {
  count?: number;
  columns?: number;
  style?: StyleProp<ViewStyle>;
  itemBorderRadius?: number;
  itemHeight?: number;
}) {
  const itemWidth = `${100 / columns - 2}%` as `${number}%`;

  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.gridItem, { width: itemWidth }]}>
          <Skeleton
            width="100%"
            height={itemHeight}
            borderRadius={itemBorderRadius}
          />
          <Skeleton
            width="80%"
            height={12}
            borderRadius={itemBorderRadius}
            style={styles.gridLabel}
          />
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

/** My Ticket tab — matches gradient ticket card + action buttons layout. */
export function SkeletonMyTicketView({ count = 1 }: { count?: number }) {
  return (
    <View className="px-4 pt-4">
      <Skeleton width={120} height={22} borderRadius={8} style={styles.ticketSectionTitle} />
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.ticketCardShell}>
          <Skeleton width="100%" height={168} borderRadius={16} />
          <Skeleton
            width="100%"
            height={48}
            borderRadius={12}
            style={styles.ticketActionButton}
          />
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonAppShell() {
  return (
    <View style={styles.appShell}>
      <Skeleton width="100%" height={180} borderRadius={SKELETON_SQUARE} />
      <Skeleton width="55%" height={20} borderRadius={SKELETON_SQUARE} style={styles.appShellTitle} />
      <SkeletonCardGrid count={4} itemBorderRadius={SKELETON_SQUARE} />
      <Skeleton width="100%" height={120} borderRadius={SKELETON_SQUARE} style={styles.appShellBlock} />
    </View>
  );
}

/** Full Home layout — safe area, header, banner, tabs, directory card. */
export function HomeScreenSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={styles.homeScreenShell}>
      <StatusBar style="dark" />
      <View style={styles.homeHeaderRow}>
        <Skeleton width={68} height={36} borderRadius={SKELETON_SQUARE} />
        <Skeleton
          width={92}
          height={36}
          borderRadius={SKELETON_SQUARE}
          style={styles.homeHeaderGap}
        />
        <View style={styles.homeHeaderSpacer} />
        <Skeleton width={36} height={36} borderRadius={SKELETON_SQUARE} />
        <Skeleton
          width={36}
          height={36}
          borderRadius={SKELETON_SQUARE}
          style={styles.homeHeaderIconGap}
        />
        <Skeleton width={36} height={36} borderRadius={SKELETON_SQUARE} />
      </View>

      <View style={styles.homeScrollContent}>
        <Skeleton
          width="100%"
          height={180}
          borderRadius={SKELETON_SQUARE}
          style={styles.homeBanner}
        />

        <View style={styles.homeDirectoryCard}>
          <Skeleton width="38%" height={20} borderRadius={SKELETON_SQUARE} />
          <Skeleton
            width="92%"
            height={14}
            borderRadius={SKELETON_SQUARE}
            style={styles.homeCardLine}
          />
          <Skeleton
            width="78%"
            height={14}
            borderRadius={SKELETON_SQUARE}
            style={styles.homeCardLineTight}
          />
          <SkeletonCardGrid
            count={4}
            columns={2}
            itemBorderRadius={SKELETON_SQUARE}
            itemHeight={72}
            style={styles.homeDirectoryCardGrid}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/** Home directory card — shimmer placeholders (grid or list). */
export function HomeDirectorySkeleton({
  style,
  fullScreen = false,
  variant = "grid",
}: {
  style?: StyleProp<ViewStyle>;
  /** Fills the viewport (e.g. AppNavigator auth bootstrap before Home mounts). */
  fullScreen?: boolean;
  /** `grid` for exhibitor/partner/startup cards; `list` for speaker rows. */
  variant?: "grid" | "list";
}) {
  if (fullScreen) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={[styles.homeDirectorySkeleton, style]}>
      {variant === "list" ? (
        <SkeletonListRows count={4} hasAvatar style={styles.homeDirectoryList} />
      ) : (
        <SkeletonCardGrid
          count={4}
          columns={2}
          itemBorderRadius={SKELETON_SQUARE}
          style={styles.homeDirectoryGrid}
        />
      )}
    </View>
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
  ticketSectionTitle: {
    marginBottom: 16,
  },
  ticketCardShell: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  ticketActionButton: {
    marginTop: 32,
    marginBottom: 12,
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
  },
  homeDirectoryGrid: {
    paddingHorizontal: 0,
  },
  homeDirectoryCardGrid: {
    paddingHorizontal: 0,
    marginTop: 16,
  },
  homeDirectoryList: {
    paddingHorizontal: 0,
  },
  homeScreenShell: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  homeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  homeHeaderGap: {
    marginLeft: 4,
  },
  homeHeaderSpacer: {
    flex: 1,
  },
  homeHeaderIconGap: {
    marginLeft: 4,
  },
  homeScrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  homeBanner: {
    marginBottom: 12,
  },
  homeDirectoryCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  homeCardLine: {
    marginTop: 12,
  },
  homeCardLineTight: {
    marginTop: 8,
  },
});
