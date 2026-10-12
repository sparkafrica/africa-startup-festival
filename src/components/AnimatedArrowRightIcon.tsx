import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { ArrowRightIcon } from "./icons";

type AnimatedArrowRightIconProps = {
  size?: number;
  color?: string;
};

/** Shared horizontal CTA nudge. Stays still when Reduce Motion is enabled. */
export default function AnimatedArrowRightIcon({
  size = 16,
  color = "#FFFFFF",
}: AnimatedArrowRightIconProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let disposed = false;

    const configureAnimation = (reduceMotionEnabled: boolean) => {
      animation?.stop();
      animation = null;
      translateX.stopAnimation();
      translateX.setValue(0);

      if (disposed || reduceMotionEnabled) return;

      animation = Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(translateX, {
            toValue: 3,
            duration: 360,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -1,
            duration: 420,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 240,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(700),
        ]),
      );
      animation.start();
    };

    void AccessibilityInfo.isReduceMotionEnabled().then(configureAnimation);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      configureAnimation,
    );

    return () => {
      disposed = true;
      subscription.remove();
      animation?.stop();
      translateX.stopAnimation();
    };
  }, [translateX]);

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <ArrowRightIcon size={size} color={color} />
    </Animated.View>
  );
}
