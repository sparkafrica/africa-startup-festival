import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import Svg, { Path, Rect } from "react-native-svg";
import { CloseIcon, ChevronRightIcon } from "../components/MenuIcons";

interface IconProps {
  size?: number;
  color?: string;
}

function EmailIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
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

function SendIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
      <Text className="text-[28px] font-bold text-black">Contact Us</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-10 h-10 items-center justify-center"
        hitSlop={10}
      >
        <CloseIcon size={20} color="#000000" />
      </Pressable>
    </View>
  );
}

const SUPPORT_EMAIL = "contact@africatechnologyexpo.com";

export default function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      Alert.alert(
        "Missing fields",
        "Please fill in Name, Email, Subject, and Message."
      );
      return;
    }

    const body = [
      `From: ${trimmedName} <${trimmedEmail}>`,
      "",
      trimmedMessage,
    ].join("\n");

    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(trimmedSubject)}&body=${encodeURIComponent(body)}`;

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
          setName("");
          setEmail("");
          setSubject("");
          setMessage("");
        } else {
          Alert.alert(
            "Cannot send email",
            "No email app is configured. You can copy the address: " + SUPPORT_EMAIL
          );
        }
      })
      .catch(() => {
        Alert.alert("Error", "Could not open email client.");
      });
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Header />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View className="px-6">
              {/* Email Support Card */}
              <Pressable
                className="bg-white border border-neutral-200 rounded-2xl p-4 mb-6"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: "#3B82F6" }}
                  >
                    <EmailIcon size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-black mb-1">
                      Email Support
                    </Text>
                    <Text className="text-sm text-black mb-1">
                      {SUPPORT_EMAIL}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      Response within 24 hours
                    </Text>
                  </View>
                  <ChevronRightIcon size={18} color="#C4C4C4" />
                </View>
              </Pressable>

              {/* Send Message Section */}
              <View>
                <Text className="text-base font-bold text-black mb-4">
                  Send Message
                </Text>

                {/* Name Input */}
                <View className="mb-4">
                  <TextInput
                    className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                    value={name}
                    onChangeText={setName}
                    placeholder="Name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Email Input */}
                <View className="mb-4">
                  <TextInput
                    className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Subject Input */}
                <View className="mb-4">
                  <TextInput
                    className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Subject"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Message Textarea */}
                <View className="mb-6">
                  <TextInput
                    className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black min-h-[120px]"
                    value={message}
                    onChangeText={setMessage}
                    placeholder="How can we help you?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Send Message Button */}
                <Pressable
                  onPress={handleSendMessage}
                  className="bg-black rounded-xl py-4 flex-row items-center justify-center"
                >
                  <SendIcon size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-semibold ml-2">
                    Send Message
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
