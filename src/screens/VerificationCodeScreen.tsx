import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type {
  RootStackScreenProps,
  RootStackParamList,
} from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Svg, { Path, Rect } from "react-native-svg";

// Email Icon Component
function EmailIcon({
  size = 24,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6L12 13L2 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function VerificationCodeScreen() {
  const route = useRoute<RootStackScreenProps<"VerificationCode">["route"]>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { email } = route.params;
  const { verifyCode, requestVerificationCode } = useAuth();

  const [code, setCode] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleCodeChange = (value: string, index: number) => {
    // Only allow single character
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const codeString = code.join("");

    // For testing: accept any 4 characters
    if (codeString.length !== 4) {
      Alert.alert("Invalid Code", "Please enter a 4-digit code");
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyCode(email, codeString);

      console.log("Code verified, navigating to Welcome...");

      // Navigate to Welcome screen immediately
      // The navigation should work since Welcome is in the same AuthNavigator stack
      navigation.navigate("Welcome");
    } catch (error) {
      Alert.alert("Error", "Invalid verification code. Please try again.");
      console.error("Error verifying code:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      await requestVerificationCode(email);
      Alert.alert("Success", "Verification code has been resent to your email");

      // Clear current code
      setCode(["", "", "", ""]);
      inputRefs[0].current?.focus();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to resend verification code. Please try again."
      );
      console.error("Error resending code:", error);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit.length === 1);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-8">
            {/* Main Content Card */}
            <View
              className="bg-white rounded-3xl px-6 py-8"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {/* Email Icon */}
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center border border-neutral-200">
                  <EmailIcon size={28} color="#000000" />
                </View>
              </View>

              {/* Title */}
              <Text className="text-[28px] font-bold text-neutral-900 text-center mb-2">
                Enter Verification Code
              </Text>

              {/* Subtitle */}
              <Text className="text-base text-neutral-600 text-center mb-8">
                We've sent a 4 digits code to{" "}
                <Text className="font-medium text-neutral-900">{email}</Text>
              </Text>

              {/* Code Input Fields */}
              <View className="flex-row justify-center gap-3 mb-8">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs[index]}
                    className="w-16 h-16 border border-neutral-300 rounded-xl text-center text-2xl font-bold text-neutral-900"
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isSubmitting}
                    style={{
                      borderColor: digit.length > 0 ? "#1BB273" : "#D4D4D4",
                    }}
                  />
                ))}
              </View>

              {/* Submit Code Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={!isCodeComplete || isSubmitting}
                className={`rounded-xl py-4 items-center justify-center ${
                  isCodeComplete && !isSubmitting
                    ? "bg-black"
                    : "bg-neutral-300"
                }`}
                style={{
                  opacity: isCodeComplete && !isSubmitting ? 1 : 0.6,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Submit Code
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer - Resend Code */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white items-center pb-6 pt-4"
          style={{
            paddingBottom: Platform.OS === "ios" ? 34 : 24,
          }}
        >
          <Text className="text-base text-neutral-600 mb-2">
            Experiencing issues receiving the code?
          </Text>
          <Pressable
            onPress={handleResendCode}
            disabled={isResending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text className="text-base text-neutral-900 underline font-medium">
                Resend code
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
