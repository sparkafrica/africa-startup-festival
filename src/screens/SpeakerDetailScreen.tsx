import React, { useState } from "react";
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
import {
  RequestMeetingModal,
  type MeetingFormData,
} from "../components";

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
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);

  // TODO: Replace with backend data
  const speakerData = {
    name: "Ada Okafor",
    title: "VC Partner",
    company: "Skyline Ventures",
    avatar: null, // Can be image source or null
    avatarColor: "#2762C7", // Blue
    bio: "Empowering innovation across Africa. High-growth tech company showcasing new products at Spark Summit.",
    tags: [
      {
        id: "fintech",
        label: "Fintech",
        color: "#3B82F6",
        borderColor: "#93C5FD",
      },
      {
        id: "nigeria",
        label: "Nigeria",
        color: "#10B981",
        borderColor: "#6EE7B7",
      },
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
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.modalContainer}>
        {/* Draggable Handle - at the very top */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Speaker Header */}
          <View className="px-4 mb-6" style={{ marginTop: 8 }}>
            <View className="flex-row items-start mt-4">
              {/* Avatar */}
              <View className="w-20 h-20 rounded-full items-center justify-center mr-4 bg-white border border-neutral-300">
                {speakerData.avatar ? (
                  <Image
                    source={speakerData.avatar as ImageSourcePropType}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 32 }}>👤</Text>
                )}
              </View>

              {/* Name and Title */}
              <View className="flex-1 mt-4">
                <Text className="text-2xl font-bold text-neutral-900 mb-1">
                  {speakerData.name}
                </Text>
                <Text className="text-base text-neutral-600">
                  {speakerData.title} • {speakerData.company}
                </Text>
              </View>
            </View>

            {/* Tags */}
            <View className="flex-row flex-wrap gap-2 mt-6">
              {speakerData.tags.map((tag) => (
                <View
                  key={tag.id}
                  className="px-3 py-1.5 rounded-full border bg-white"
                  style={{
                    borderColor: tag.borderColor,
                  }}
                >
                  <Text className="text-xs font-medium text-neutral-900">
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bio */}
            <Text className="text-sm text-neutral-700 leading-5 mt-4">
              {speakerData.bio}
            </Text>
          </View>

          {/* Interests Section */}
          <View className="px-4 mb-6">
            <Text className="text-sm font-normal text-neutral-900 mb-3">
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
            <Text className="text-sm font-normal text-neutral-900 mb-3">
              Speaking Sessions
            </Text>
            {speakerData.speakingSessions.map((session) => (
              <Pressable
                key={session.id}
                className="bg-neutral-100 rounded-xl p-4 border border-neutral-200"
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
          <View className="px-4 pt-8 pb-6">
            <Pressable
              className="bg-neutral-900 rounded-xl py-4 items-center flex-row justify-center mb-3"
              onPress={() => {
                setIsRequestMeetingModalVisible(true);
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

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => {
          setIsRequestMeetingModalVisible(false);
        }}
        onSubmit={(data: MeetingFormData) => {
          console.log("========================================");
          console.log("📅 MEETING REQUEST SUBMITTED");
          console.log("========================================");
          console.log("Speaker Information:");
          console.log("  - Speaker ID:", speakerId);
          console.log("  - Speaker Name:", speakerData.name);
          console.log("  - Title:", speakerData.title);
          console.log("  - Company:", speakerData.company);
          console.log("");
          console.log("Meeting Details:");
          console.log("  - Title:", data.title);
          console.log("  - Type:", data.meetingType);
          if (data.meetingType === "Physical" && data.tableNumber) {
            console.log("  - Table Number:", data.tableNumber);
          }
          if (data.meetingType === "Virtual" && data.meetingLink) {
            console.log("  - Meeting Link:", data.meetingLink);
          }
          if (data.date) {
            console.log("  - Date:", data.date);
          }
          if (data.time) {
            console.log("  - Time:", data.time);
          }
          console.log("  - Description:", data.description);
          console.log("");
          console.log("Full Meeting Data Object:", {
            speakerId,
            speakerName: speakerData.name,
            speakerTitle: speakerData.title,
            speakerCompany: speakerData.company,
            meetingData: data,
          });
          console.log("========================================");
          // TODO: Send meeting request to backend
          setIsRequestMeetingModalVisible(false);
        }}
        attendeeName={speakerData.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
});
