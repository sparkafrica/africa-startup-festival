import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
} from "react-native";
import {
  PROFILE_TAG_COLORS,
  type ProfileTagKind,
} from "../constants/profileTagColors";

const LOGO_SIZE = 88;

export type StartupDirectoryTag = {
  label: string;
  kind: ProfileTagKind;
};

interface StartupDirectoryCardProps {
  name: string;
  logo?: string | number;
  logoColor?: string;
  tags?: StartupDirectoryTag[];
  /** Home featured row: logo + name only. Full directory screens show tags. */
  compact?: boolean;
  onPress?: () => void;
}

export default function StartupDirectoryCard({
  name,
  logo,
  logoColor = "#3B82F6",
  tags = [],
  compact = false,
  onPress,
}: StartupDirectoryCardProps) {
  const imageSource: ImageSourcePropType | undefined = logo
    ? typeof logo === "string"
      ? { uri: logo }
      : logo
    : undefined;

  const visibleTags = tags.filter((t) => t?.label);

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-neutral-200 w-full overflow-hidden"
      style={{ borderRadius: 0 }}
    >
      <View
        className="items-center justify-center"
        style={{ paddingHorizontal: 12, paddingTop: compact ? 12 : 16, paddingBottom: 8 }}
      >
        {logo ? (
          <Image
            source={imageSource}
            style={{
              width: compact ? 72 : LOGO_SIZE,
              height: compact ? 72 : LOGO_SIZE,
              borderRadius: 0,
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: compact ? 72 : LOGO_SIZE,
              height: compact ? 72 : LOGO_SIZE,
              borderRadius: 0,
              backgroundColor: logoColor,
            }}
          >
            <Text className="text-white font-bold text-3xl">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>

      <View className="px-2.5 pb-3">
        <Text
          className="text-[13px] text-neutral-900 text-center font-semibold leading-4 mb-2"
          numberOfLines={2}
        >
          {name}
        </Text>

        {!compact && visibleTags.length > 0 ? (
          <View className="flex-row flex-wrap justify-start">
            {visibleTags.map((tag) => {
              const palette = PROFILE_TAG_COLORS[tag.kind];
              return (
                <View
                  key={`${name}-${tag.kind}-${tag.label}`}
                  className="px-2 py-1 mr-1 mb-1"
                  style={{
                    borderRadius: 0,
                    backgroundColor: palette.bg,
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                >
                  <Text
                    className="text-[11px] font-medium"
                    style={{ color: palette.text }}
                    numberOfLines={1}
                  >
                    {tag.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
