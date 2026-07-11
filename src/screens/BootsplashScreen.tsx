import React, { useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const guidelineImage = require("../assets/images/guideline.png");
const logotypeWhite = require("../assets/images/ASF-Logotype-White.png");
const logotypeBlk = require("../assets/images/ASF-Logotype-BLK.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

/** Branded intro length before fade-out (ms). Kept in sync with OTA_SPLASH_MIN_DURATION_MS. */
export const BOOTSPLASH_ANIMATION_DURATION_MS = 3500;

interface BootsplashScreenProps {
  visible: boolean;
  onComplete: () => void;
  /** When false (OTA apply), animation plays and holds — parent calls reloadAsync. Default true. */
  autoComplete?: boolean;
}

export default function BootsplashScreen({
  visible,
  onComplete,
  autoComplete = true,
}: BootsplashScreenProps) {
  const patternOpacity = useSharedValue(0);
  const patternScale = useSharedValue(1.08);
  const whiteLogoOpacity = useSharedValue(0);
  const whiteLogoScale = useSharedValue(0.92);
  const sceneOpacity = useSharedValue(1);
  const lightSceneOpacity = useSharedValue(0);
  const blackLogoOpacity = useSharedValue(0);
  const blackLogoScale = useSharedValue(0.96);

  useEffect(() => {
    if (!visible) return;

    patternOpacity.value = 0;
    patternScale.value = 1.08;
    whiteLogoOpacity.value = 0;
    whiteLogoScale.value = 0.92;
    sceneOpacity.value = 1;
    lightSceneOpacity.value = 0;
    blackLogoOpacity.value = 0;
    blackLogoScale.value = 0.96;

    patternOpacity.value = withTiming(0.22, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    patternScale.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    whiteLogoOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    whiteLogoScale.value = withDelay(
      500,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );

    lightSceneOpacity.value = withDelay(
      1700,
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) }),
    );
    blackLogoOpacity.value = withDelay(
      1850,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
    blackLogoScale.value = withDelay(
      1850,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    if (autoComplete) {
      sceneOpacity.value = withDelay(
        3000,
        withSequence(
          withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }),
          withTiming(0, { duration: 0 }, (finished) => {
            if (finished) {
              runOnJS(onComplete)();
            }
          }),
        ),
      );
    }
  }, [
    visible,
    autoComplete,
    patternOpacity,
    patternScale,
    whiteLogoOpacity,
    whiteLogoScale,
    sceneOpacity,
    lightSceneOpacity,
    blackLogoOpacity,
    blackLogoScale,
    onComplete,
  ]);

  const patternStyle = useAnimatedStyle(() => ({
    opacity: patternOpacity.value,
    transform: [{ scale: patternScale.value }],
  }));

  const whiteLogoStyle = useAnimatedStyle(() => ({
    opacity: whiteLogoOpacity.value,
    transform: [{ scale: whiteLogoScale.value }],
  }));

  const darkSceneStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value * (1 - lightSceneOpacity.value),
  }));

  const lightSceneStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value * lightSceneOpacity.value,
  }));

  const blackLogoStyle = useAnimatedStyle(() => ({
    opacity: blackLogoOpacity.value,
    transform: [{ scale: blackLogoScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
      onRequestClose={autoComplete ? onComplete : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <Animated.View style={[styles.scene, styles.darkScene, darkSceneStyle]}>
          <Animated.Image
            source={guidelineImage}
            style={[styles.pattern, patternStyle]}
            resizeMode="cover"
          />
          <Animated.View style={[styles.logoWrap, whiteLogoStyle]}>
            <Image
              source={logotypeWhite}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.scene, styles.lightScene, lightSceneStyle]}>
          <Animated.View style={[styles.logoWrap, blackLogoStyle]}>
            <Image
              source={logotypeBlk}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  darkScene: {
    backgroundColor: "#000000",
  },
  lightScene: {
    backgroundColor: "#FFFFFF",
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  logoWrap: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 0.42,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
