import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

function ChevronDownIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 7.5L10 12.5L15 7.5"
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

export default function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("Select Topic");
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    console.log("Send Message", { name, email, selectedTopic, message });
    // TODO: Implement send message functionality
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
                onPress={() => {
                  // TODO: Open email client or copy email
                  console.log("Email Support pressed");
                }}
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
                      support@sparkevent.com
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

                {/* Select Topic Dropdown */}
                <View className="mb-4">
                  <Pressable className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        selectedTopic === "Select Topic"
                          ? "text-neutral-400"
                          : "text-black"
                      }`}
                    >
                      {selectedTopic}
                    </Text>
                    <ChevronDownIcon size={20} color="#404040" />
                  </Pressable>
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



