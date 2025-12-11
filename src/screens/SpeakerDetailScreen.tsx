import React from "react";
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { LinkedInIcon, CalendarIconWhite } from "../components/SocialIcons";

// ============================================
// MODAL HEIGHT CONFIGURATION
// Change this value to adjust modal height (0.0 to 1.0)
// Example: 0.7 = 70%, 0.8 = 80%, 0.9 = 90%
// ============================================
const MODAL_HEIGHT_PERCENTAGE = 0.85;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * MODAL_HEIGHT_PERCENTAGE;

type Props = RootStackScreenProps<"SpeakerDetail">;

export default function SpeakerDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp<any>>();
  const { speakerId, name = "Ada Okafor" } = route.params;

  // TODO: Replace with backend data
  const speakerData = {
    name: "Ada Okafor",
    title: "VC Partner",
    company: "Skyline Ventures",
    avatar: null, // Can be image source or null
    avatarColor: "#2762C7", // Blue
    bio: "Empowering innovation across Africa. High-growth tech company showcasing new products at Spark Summit.",
    tags: [
      { id: "fintech", label: "Fintech", color: "#3B82F6", borderColor: "#93C5FD" },
      { id: "nigeria", label: "Nigeria", color: "#10B981", borderColor: "#6EE7B7" },
    ],
    interests: [
      { id: "fintech-interest", label: "Fintech" },
      { id: "infrastructure", label: "Infrastructure" },
      { id: "developer-tools", label: "Developer Tools" },
    ],
    speakingSessions: [
      {
        id: "1",
        title: "The Future of African Fintech",
        stage: "Main Stage",
        time: "10:00 AM",
      },
    ],
    linkedinUrl: "https://linkedin.com/in/ada-okafor",
  };

  return (
    <View className="flex-1 bg-white" style={styles.modalContainer}>
      {/* Draggable Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3 flex-row items-center"
            hitSlop={10}
          >
            <ChevronLeftIcon size={24} color="#404040" />
          </Pressable>
        </View>

        {/* Speaker Header */}
        <View className="px-4 mb-6">
          <View className="flex-row items-start mb-4">
            {/* Avatar */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: speakerData.avatarColor }}
            >
              {speakerData.avatar ? (
                <Image
                  source={speakerData.avatar as ImageSourcePropType}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white font-bold text-3xl">
                  {speakerData.name.charAt(0)}
                </Text>
              )}
            </View>

            {/* Name and Title */}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-900 mb-1">
                {speakerData.name}
              </Text>
              <Text className="text-base text-neutral-600">
                {speakerData.title} • {speakerData.company}
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {speakerData.tags.map((tag) => (
              <View
                key={tag.id}
                className="px-3 py-1.5 rounded-full border"
                style={{
                  borderColor: tag.borderColor,
                  backgroundColor: tag.color === "#3B82F6" ? "#EFF6FF" : "#ECFDF5",
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: tag.color,
                  }}
                >
                  {tag.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Bio */}
          <Text className="text-sm text-neutral-700 leading-5">
            {speakerData.bio}
          </Text>
        </View>

        {/* Interests Section */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-neutral-900 mb-3">
            Interests
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {speakerData.interests.map((interest) => (
              <View
                key={interest.id}
                className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full"
              >
                <Text className="text-xs text-neutral-900">
                  {interest.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Speaking Sessions Section */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-neutral-900 mb-3">
            Speaking Sessions
          </Text>
          {speakerData.speakingSessions.map((session) => (
            <Pressable
              key={session.id}
              className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text className="text-base font-bold text-neutral-900 mb-2">
                {session.title}
              </Text>
              <Text className="text-sm text-neutral-600">
                {session.stage} • {session.time}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <SafeAreaView
        edges={["bottom"]}
        className="bg-white border-t border-neutral-200"
      >
        <View className="px-4 pt-4 pb-2">
          <Pressable
            className="bg-neutral-900 rounded-xl py-4 items-center flex-row justify-center mb-3"
            onPress={() => {
              // TODO: Navigate to meeting request
              console.log("Request Meeting");
            }}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <CalendarIconWhite size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white ml-2">
              Request Meeting
            </Text>
          </Pressable>

          <Pressable
            className="bg-neutral-100 rounded-xl py-4 items-center flex-row justify-center"
            onPress={() => {
              // TODO: Open LinkedIn profile
              console.log("Connect on LinkedIn");
            }}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <LinkedInIcon size={20} color="#0A66C2" />
            <Text className="text-base font-semibold text-neutral-900 ml-2">
              Connect on Linkedin
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
});

