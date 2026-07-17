import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components";
import { logError, ERROR_TAGS } from "../utils/logError";
import { EVENT_WEBSITE_URL, SUPPORT_EMAIL } from "../config/env";

// Logo import
const logoImage = require("../assets/images/logo.png");

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { requestVerificationCode } = useAuth();
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setIsEmailValid(validateEmail(text));
  };

  const handleSendCode = async () => {
    if (!isEmailValid) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestVerificationCode(email);

      // Navigate to verification code screen
      navigation.navigate("VerificationCode", { email });
    } catch (error: any) {
      const msg = error?.message ?? "";
      const isNoTicket =
        /user with this email does not exist/i.test(msg) ||
        /does not exist/i.test(msg);
      if (isNoTicket) {
        logError(
          error,
          { screen: "Login", email, reason: "no_ticket" },
          { error_type: ERROR_TAGS.VALIDATION }
        );
        Alert.alert(
          "Error",
          "You don't have a valid festival ticket. Please purchase one and return to login."
        );
      } else {
        logError(error, { screen: "Login", email });
        Alert.alert("Error", "Failed to send verification code. Please try again.", [
          { text: "OK", style: "cancel" },
          { text: "Retry", onPress: () => handleSendCode() },
        ]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetTicket = () => {
    // TODO: BACKEND INTEGRATION - Navigate to ticket purchase page or open external link
    // TODO: BACKEND - Consider deep linking to ticket purchase flow
    // TODO: BACKEND - Track analytics for ticket purchase clicks
    Alert.alert("Get Ticket", "This will open the ticket purchase page");
  };

  const handleContactUs = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Contact support", `Email: ${SUPPORT_EMAIL}`);
      }
    } catch {
      Alert.alert("Contact support", `Email: ${SUPPORT_EMAIL}`);
    }
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
          <View className="flex-1 justify-center px-6 py-4">
            {/* Main Content Card */}
            <View
              className="bg-white rounded-3xl px-6 py-14"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
                minHeight: 460, // Makes the card visually taller
              }}
            >
              {/* Logo */}
              <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-black items-center justify-center overflow-hidden">
                  <Image
                    source={logoImage}
                    style={{ width: 60, height: 60 }}
                    resizeMode="contain"
                    onError={(error) => {
                      console.log("Logo image error:", error);
                    }}
                  />
                </View>
              </View>

              {/* Title */}
              <Text className="text-[22px] font-bold text-neutral-900 text-center mb-2">
                Log in with your Event Ticket
              </Text>

              {/* Subtitle */}
              <Text className="text-[12px] text-neutral-600 text-center mb-10">
                Use the same email linked to your ticket.
              </Text>

              {/* Email Input Field */}
              <View className="mb-8">
                {/* <Text className="text-sm font-medium text-neutral-700 mb-2">
                  Email linked to your ticket
                </Text> */}
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-4 text-base text-neutral-900"
                  placeholder="you@example.com"
                  placeholderTextColor="#A3A3A3"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isSubmitting}
                  style={{
                    borderColor:
                      isEmailValid && email.length > 0 ? "#1BB273" : "#D4D4D4",
                  }}
                />
              </View>

              {/* Send Verification Code Button */}
              <Pressable
                onPress={handleSendCode}
                disabled={!isEmailValid || isSubmitting}
                className={`rounded-xl py-4 items-center justify-center ${
                  isEmailValid && !isSubmitting ? "bg-black" : "bg-neutral-300"
                }`}
                style={{
                  opacity: isEmailValid && !isSubmitting ? 1 : 0.6,
                }}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Send verification code
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer Links */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white items-center pb-10 pt-4"
          style={{
            paddingBottom: Platform.OS === "ios" ? 34 : 24,
          }}
        >
          <Text className="text-base text-neutral-600 mb-3">
            Don't have a ticket?{" "}
            <Text
              className="text-neutral-900 underline font-medium"
              onPress={async () => {
                try {
                  const url = EVENT_WEBSITE_URL;
                  const canOpen = await Linking.canOpenURL(url);
                  if (canOpen) {
                    await Linking.openURL(url);
                  } else {
                    Alert.alert("Error", "Cannot open this URL");
                  }
                } catch (error) {
                  console.error("Error opening URL:", error);
                  Alert.alert("Error", "Failed to open link");
                }
              }}
            >
              Get one
            </Text>
          </Text>

          <Pressable
            onPress={handleContactUs}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-base text-neutral-600">
              Having issues?{" "}
              <Text className="text-neutral-900 underline font-medium">
                Contact us
              </Text>
            </Text>
          </Pressable>

          {/* Temporary: API Test Screen Access - Remove before production */}
          {/* <Pressable
            onPress={() => navigation.navigate("ApiTest")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mt-4"
          >
            <Text className="text-xs text-blue-600 underline">
              🧪 API Test Screen (Development Only)
            </Text>
          </Pressable> */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
