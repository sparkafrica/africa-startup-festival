import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import Svg, { Circle, Path } from "react-native-svg";

function SuccessCheckmarkIcon({ size = 120 }: { size?: number }) {
  return (
    <View className="relative items-center justify-center">
      {/* Outer glow circle */}
      <View
        className="absolute"
        style={{
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: (size * 1.5) / 2,
          backgroundColor: "rgba(52, 199, 89, 0.2)", // Light green with transparency
        }}
      />
      {/* Inner green circle */}
      <View
        className="absolute"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#34C759", // iOS green
        }}
      />
      {/* Checkmark */}
      <Svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10"
      >
        <Path
          d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}

export default function ProfileCreatedScreen() {
  const { completeProfile } = useAuth();

  // Log when screen mounts to verify it's being shown
  React.useEffect(() => {
    console.log(
      "ProfileCreatedScreen mounted - success screen should be visible"
    );
  }, []);

  const handleContinue = async () => {
    try {
      // Complete profile - this will trigger AppNavigator to automatically
      // switch from AuthNavigator to MainNavigator on the next render
      // No manual navigation needed - AppNavigator handles the switch
      await completeProfile();
    } catch (error) {
      console.error("Error completing profile:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        {/* Success Icon */}
        <View className="mb-8">
          <SuccessCheckmarkIcon size={120} />
        </View>

        {/* Success Message */}
        <Text className="text-[32px] font-bold text-neutral-900 text-center my-12">
          Profile Created Successfully!
        </Text>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          className="bg-black rounded-full px-12 py-4 w-full max-w-sm"
        >
          <Text className="text-white text-base font-semibold text-center">
            Nice, Let's go!
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
