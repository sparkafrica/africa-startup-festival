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
const LOGO_RADIUS = 16;

export type StartupDirectoryTag = {
  label: string;
  kind: ProfileTagKind;
};

interface StartupDirectoryCardProps {
  name: string;
  logo?: string | number;
  logoColor?: string;
  tags?: StartupDirectoryTag[];
  onPress?: () => void;
}

/**
 * Mobile startups directory card — larger logo plate, clearer name + tags.
 */
export default function StartupDirectoryCard({
  name,
  logo,
  logoColor = "#3B82F6",
  tags = [],
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
      className="bg-white rounded-2xl border border-neutral-200 w-full overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Logo plate — full-width white band so the mark sits larger on mobile */}
      <View
        className="bg-neutral-50 items-center justify-center border-b border-neutral-100"
        style={{ height: 112, paddingHorizontal: 12 }}
      >
        {logo ? (
          <Image
            source={imageSource}
            style={{
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              borderRadius: LOGO_RADIUS,
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              borderRadius: LOGO_RADIUS,
              backgroundColor: logoColor,
            }}
          >
            <Text className="text-white font-bold text-3xl">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>

      <View className="px-2.5 pt-2.5 pb-3">
        <Text
          className="text-[13px] text-neutral-900 text-center font-semibold leading-4 mb-2"
          numberOfLines={2}
        >
          {name}
        </Text>

        {visibleTags.length > 0 ? (
          <View className="flex-row flex-wrap justify-start">
            {visibleTags.map((tag) => {
              const palette = PROFILE_TAG_COLORS[tag.kind];
              return (
                <View
                  key={`${name}-${tag.kind}-${tag.label}`}
                  className="px-2 py-1 mr-1 mb-1 rounded-md"
                  style={{
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
