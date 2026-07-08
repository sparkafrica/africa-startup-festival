import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRightIcon } from "./icons";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";

export type BannerVariant = "black" | "white";

const variantStyles = {
  black: {
    title: "text-white",
    description: "text-white/90",
    button: "bg-white border border-black",
    buttonText: "text-black",
    iconColor: "#000000",
    cardBorder: "",
    cardPatternOpacity: 0.2,
    buttonPatternOpacity: 0.2,
  },
  white: {
    title: "text-black",
    description: "text-black/80",
    button: "bg-black border border-white",
    buttonText: "text-white",
    iconColor: "#FFFFFF",
    cardBorder: "border border-neutral-200",
    cardPatternOpacity: 0.1,
    buttonPatternOpacity: 0.5,
  },
};

interface BannerCardProps {
  title: string | React.ReactNode;
  description: string;
  buttonText: string;
  gradient: string[];
  variant?: BannerVariant;
  backgroundImage?: ImageSourcePropType;
  onPress?: () => void;
  /** Full-width vertical stack (post-event home). Default: horizontal carousel card. */
  stacked?: boolean;
}

export default function BannerCard({
  title,
  description,
  buttonText,
  gradient,
  variant = "black",
  backgroundImage,
  onPress,
  stacked = false,
}: BannerCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const styles = variantStyles[variant];
  const cardWidth = stacked
    ? windowWidth - 32
    : Math.min(320, Math.round(windowWidth * 0.85));
  /** Tall hero — same 180px as original w-80 design; not tied to narrow %-of-width. */
  const imageHeight = 180;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-3xl overflow-hidden ${styles.cardBorder} ${stacked ? "" : "mr-3"}`}
      style={[
        { width: cardWidth, flexDirection: "column" },
        !stacked ? { alignSelf: "stretch" } : null,
      ]}
    >
      {backgroundImage && (
        <Image
          source={backgroundImage}
          className="w-full rounded-t-3xl"
          style={{ height: imageHeight }}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 2, y: 2 }}
        className="px-4 pt-4 pb-4 rounded-b-3xl overflow-hidden relative"
        style={{ flex: 1, minHeight: 156 }}
      >
        <GuidelinePatternOverlay
          isLightCard={variant === "white"}
          opacity={styles.cardPatternOpacity}
        />
        <View
          className="relative z-10"
          style={{ flex: 1, justifyContent: "space-between" }}
        >
          <View>
            {typeof title === "string" ? (
              <Text
                className={`text-lg font-inter-semibold leading-snug mb-1.5 ${styles.title}`}
              >
                {title}
              </Text>
            ) : (
              <View className="mb-1.5">{title}</View>
            )}

            <Text
              className={`text-[14px] font-inter-normal leading-5 ${styles.description}`}
            >
              {description}
            </Text>
          </View>

          <Pressable
            onPress={onPress}
            className={`w-full py-2.5 rounded-xl flex-row items-center justify-center mt-4 overflow-hidden relative ${styles.button}`}
          >
            <GuidelinePatternOverlay
              isLightCard={variant === "black"}
              opacity={styles.buttonPatternOpacity}
            />
            <Text
              className={`text-[15px] font-inter-bold mr-2 relative z-10 ${styles.buttonText}`}
            >
              {buttonText}
            </Text>
            <View className="relative z-10">
              <ArrowRightIcon size={16} color={styles.iconColor} />
            </View>
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
