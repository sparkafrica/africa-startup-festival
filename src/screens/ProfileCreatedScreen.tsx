import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getProfileDebug } from "../services/authService";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";
import Svg, { Path } from "react-native-svg";

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
  const { showToast, hideToast, toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await completeProfile();
    } catch (error) {
      console.error("Error completing profile:", error);
      showToast(
        "We're having trouble verifying your profile. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongPressDebug = async () => {
    const raw = await getProfileDebug();
    let text: string;
    if (raw) {
      try {
        text = JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        text = raw;
      }
    } else {
      text = "No debug data yet. Complete profile save first.";
    }
    await Clipboard.setStringAsync(text);
    const preview = text.length > 500 ? text.slice(0, 500) + "\n..." : text;
    Alert.alert("Profile Debug (copied)", preview, [
      { text: "OK" },
    ]);
    showToast("Debug info copied to clipboard", "success");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
      <View className="flex-1 items-center justify-center px-6">
        {/* Success Icon */}
        <View className="mb-8">
          <SuccessCheckmarkIcon size={120} />
        </View>

        {/* Success Message */}
        <Text className="text-[32px] font-bold text-neutral-900 text-center my-12">
          Profile Created Successfully!
        </Text>

        {/* Continue Button - long-press to copy profile API debug info */}
        <Pressable
          onPress={handleContinue}
          onLongPress={handleLongPressDebug}
          delayLongPress={800}
          disabled={isLoading}
          className="bg-black rounded-full px-12 py-4 w-full max-w-sm items-center justify-center min-h-[52px]"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold text-center">
              Nice, Let's go!
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
