import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type {
  RootStackScreenProps,
  RootStackParamList,
} from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components";
import { logError, ERROR_TAGS } from "../utils/logError";
import { runEarlyOtaCheckOnly } from "../utils/otaUpdateFlow";
import Svg, { Path, Rect } from "react-native-svg";

const OTP_SUCCESS_TO_BOOTSPLASH_MS = 1250;
const OTP_SUCCESS_TO_WELCOME_MS = 450;

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
  const { verifyCode, requestVerificationCode, enterMainAppWithBootsplash } =
    useAuth();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const hiddenInputRef = useRef<TextInput>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void runEarlyOtaCheckOnly();
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const digits = (text || "").replace(/\D/g, "").slice(0, 6);
      if (digits) {
        setCode(digits);
        setVerifyStatus("idle");
        hiddenInputRef.current?.focus();
      }
    } catch (_) {
      // Fallback ignored
    }
  };

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (verifyStatus !== "idle") {
      setVerifyStatus("idle");
    }
  };

  const handleSubmit = async () => {
    const codeString = code;

    // TODO: BACKEND INTEGRATION - Client-side validation (keep this)
    // For testing: accept any 6 characters
    if (codeString.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-digit code");
      return;
    }

    try {
      setIsSubmitting(true);
      const profileComplete = await verifyCode(email, codeString);

      setVerifyStatus("success");
      const delay = profileComplete
        ? OTP_SUCCESS_TO_BOOTSPLASH_MS
        : OTP_SUCCESS_TO_WELCOME_MS;

      transitionTimeoutRef.current = setTimeout(() => {
        if (profileComplete) {
          enterMainAppWithBootsplash();
        } else {
          navigation.navigate("Welcome");
        }
        setIsSubmitting(false);
      }, delay);
    } catch (error) {
      console.error("Error verifying code:", error);
      setVerifyStatus("error");
      setIsSubmitting(false);
      setTimeout(() => hiddenInputRef.current?.focus(), 50);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      // TODO: BACKEND INTEGRATION - requestVerificationCode will call backend API
      // TODO: BACKEND - Handle rate limiting (prevent spam resend requests)
      // TODO: BACKEND - Track resend attempts and enforce cooldown period
      await requestVerificationCode(email);
      Alert.alert("Success", "Verification code has been resent to your email");
      // TODO: BACKEND - Show countdown timer before allowing another resend

      // Clear current code
      setCode("");
      setVerifyStatus("idle");
      hiddenInputRef.current?.focus();
    } catch (error) {
      logError(
        error,
        { screen: "VerificationCode", email, action: "resend" },
        { error_type: ERROR_TAGS.VALIDATION }
      );
      Alert.alert(
        "Error",
        "Failed to resend verification code. Please try again.",
        [
          { text: "OK", style: "cancel" },
          { text: "Retry", onPress: () => handleResendCode() },
        ]
      );
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.length === 6;
  const digits = code.split("");

  const getBoxStyle = (index: number) => {
    const hasDigit = digits[index] !== undefined;
    const isActiveCell = isFocused && index === digits.length;

    if (verifyStatus === "error") {
      return {
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
      };
    }
    if (verifyStatus === "success") {
      return {
        borderColor: "#16A34A",
        backgroundColor: "#F0FDF4",
      };
    }
    if (hasDigit || isActiveCell) {
      return {
        borderColor: "#000000",
        backgroundColor: "#FFFFFF",
      };
    }
    return {
      borderColor: "#D4D4D4",
      backgroundColor: "#FFFFFF",
    };
  };

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
                We've sent a 6 digits code to{" "}
                <Text className="font-medium text-neutral-900">{email}</Text>
              </Text>

              {/* Code Input - Tap to focus and type. */}
              <Text className="text-xs text-neutral-500 text-center mb-2">
                Tap the boxes to type your code
              </Text>
              <Pressable
                onPress={() => hiddenInputRef.current?.focus()}
                onLongPress={handlePaste}
                delayLongPress={400}
                className="flex-row justify-center gap-2 mb-2 py-2 px-2"
                style={({ pressed }) => ({
                  borderRadius: 12,
                  backgroundColor: pressed ? "#F5F5F5" : "transparent",
                })}
              >
                <TextInput
                  ref={hiddenInputRef}
                  value={code}
                  onChangeText={handleCodeChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  editable={!isSubmitting}
                  caretHidden
                  selectTextOnFocus
                  maxLength={6}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    opacity: 0,
                    fontSize: 1,
                  }}
                />
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    className="w-11 h-14 border-2 rounded-xl items-center justify-center"
                    style={getBoxStyle(index)}
                  >
                    <Text
                      className="text-2xl font-bold"
                      style={{
                        color:
                          verifyStatus === "error" ? "#991B1B" : "#171717",
                      }}
                    >
                      {digits[index] ?? ""}
                    </Text>
                  </View>
                ))}
              </Pressable>
              {verifyStatus === "error" ? (
                <Text className="text-sm text-red-600 text-center mb-4 px-2">
                  That code doesn't look right. Please try again.
                </Text>
              ) : (
                <View className="mb-4" />
              )}
              <Pressable
                onPress={handlePaste}
                className="mb-8 py-2 px-4 self-center rounded-lg border border-neutral-300"
              >
                <Text className="text-sm font-medium text-neutral-700">
                  Paste code
                </Text>
              </Pressable>

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
                  <LoadingSpinner size="small" color="#FFFFFF" />
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
              <LoadingSpinner size="small" color="#000000" />
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
