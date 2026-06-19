import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { RootStackParamList } from "../navigation/types";
import { CloseIcon } from "../components/MenuIcons";
import {
  VENUE_FLOOR_PLAN_ASPECT,
  VENUE_FLOOR_PLAN_IMAGE,
  VENUE_MAP_INTRO,
} from "../constants/venueMap";
import { colors, spacing, typography } from "../theme/theme";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Venue map</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
        hitSlop={10}
      >
        <CloseIcon size={20} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}

type ZoomableFloorPlanProps = {
  width: number;
  height: number;
};

function ZoomableFloorPlan({ width, height }: ZoomableFloorPlanProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE * 0.5, next));
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
        savedScale.value = MAX_SCALE;
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      scale.value = withTiming(2.5);
      savedScale.value = 2.5;
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.zoomStage,
          { width, height },
          animatedStyle,
        ]}
      >
        <Image
          source={VENUE_FLOOR_PLAN_IMAGE}
          style={{ width, height }}
          resizeMode="contain"
          accessibilityLabel="ATE 2026 venue floor plan"
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function VenueMapScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const canvasWidth = windowWidth;
  const canvasHeight = Math.max(
    280,
    windowHeight - 168
  );
  const fitWidth = canvasWidth;
  const fitHeight = fitWidth * VENUE_FLOOR_PLAN_ASPECT;
  const imageWidth =
    fitHeight > canvasHeight ? canvasHeight / VENUE_FLOOR_PLAN_ASPECT : fitWidth;
  const imageHeight = imageWidth * VENUE_FLOOR_PLAN_ASPECT;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Header />
        <Text style={styles.intro}>{VENUE_MAP_INTRO}</Text>

        <View style={[styles.canvas, { height: canvasHeight }]}>
          <ZoomableFloorPlan width={imageWidth} height={imageHeight} />
        </View>

        <Text style={styles.hint}>Pinch or double-tap to zoom · drag to pan</Text>

        {/* Open in browser — disabled; in-app map is primary.
        <Pressable onPress={...}>
          ...
        </Pressable>
        */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-bold"],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.inter,
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  canvas: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: colors.neutral[100],
  },
  zoomStage: {
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    textAlign: "center",
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.inter,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
});
