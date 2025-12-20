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
import {
  GlobeIcon,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
  CalendarIconWhite,
} from "../components/SocialIcons";
import { ArrowUpRightIcon } from "../components/icons";
import {
  RequestMeetingModal,
  MeetingRequestMessageModal,
  type MeetingFormData,
} from "../components";
import { useChecklist } from "../context/ChecklistContext";

// ============================================
// MODAL HEIGHT CONFIGURATION
// Change this value to adjust modal height (0.0 to 1.0)
// Example: 0.7 = 70%, 0.8 = 80%, 0.9 = 90%
// ============================================
const MODAL_HEIGHT_PERCENTAGE = 0.5;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * MODAL_HEIGHT_PERCENTAGE;

type Props = RootStackScreenProps<"CompanyDetail">;

export default function CompanyDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp<any>>();
  const { exhibitorId, name = "Flutterwave" } = route.params;
  const { markRequestMeetingComplete } = useChecklist();
  
  // Request Meeting Modal state
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);
  
  // Meeting Request Message Modal state
  const [isMeetingRequestMessageVisible, setIsMeetingRequestMessageVisible] =
    useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState<{
    attendeeName: string;
    meetingType: "Physical" | "Virtual";
    meetingTitle: string;
  } | null>(null);

  // TODO: Replace with backend data
  const companyData = {
    name: "Flutterwave",
    logo: null, // Can be image source or null
    logoColor: "#1E40AF", // Dark blue
    booth: "24",
    website: "flutterwave.com/ng",
    industry: "Fintech",
    country: "Nigeria",
    description:
      "Empowering innovation across Africa. High-growth tech company showcasing new new products at Spark Summit.",
    eventOffers: [
      {
        id: "1",
        title: "Startup Mentorship",
        color: "#6B21A8", // Dark purple
      },
      {
        id: "2",
        title: "Free Azure Credits",
        color: "#22C55E", // Bright green
      },
    ],
    socialLinks: [
      {
        id: "facebook",
        platform: "Facebook",
        handle: "Flutterwave_ng",
        icon: FacebookIcon,
        color: "#1877F2",
      },
      {
        id: "twitter",
        platform: "Twitter",
        handle: "Flutterwave_ng",
        icon: TwitterIcon,
        color: "#000000",
      },
      {
        id: "instagram",
        platform: "Instagram",
        handle: "Flutterwave_ng",
        icon: InstagramIcon,
        color: "#000000",
      },
      {
        id: "linkedin",
        platform: "LinkedIn",
        handle: "Flutterwave.ng",
        icon: LinkedInIcon,
        color: "#0A66C2",
      },
    ],
    teamMembers: [
      { id: "1", name: "Team Member" },
      { id: "2", name: "Team Member" },
      { id: "3", name: "Team Member" },
      { id: "4", name: "Team Member" },
      { id: "5", name: "Team Member" },
    ],
    openPositions: [
      { id: "1", title: "Chief Operating Officer" },
      { id: "2", title: "Head of Marketing" },
      { id: "3", title: "Product Manager" },
    ],
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

        {/* Company Header */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center mb-4">
            {/* Logo */}
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: companyData.logoColor }}
            >
              {companyData.logo ? (
                <Image
                  source={companyData.logo as ImageSourcePropType}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              ) : (
                <Text className="text-white font-bold text-2xl">
                  {companyData.name.charAt(0)}
                </Text>
              )}
            </View>

            {/* Name and Booth */}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-900 mb-1">
                {companyData.name}
              </Text>
              <Pressable className="flex-row items-center">
                <Text className="text-sm text-neutral-500 mr-1">
                  Booth {companyData.booth}
                </Text>
                <ArrowUpRightIcon size={14} color="#A3A3A3" />
              </Pressable>
            </View>
          </View>

          {/* Tags */}
          <View className="flex-row flex-nowrap items-center justify-between mb-4">
            {/* Website Tag */}
            <Pressable className="flex-row items-center px-3 py-1.5 bg-white border border-neutral-300 rounded-full">
              <GlobeIcon size={14} color="#000000" />
              <Text className="text-xs text-neutral-900 ml-1.5">
                {companyData.website}
              </Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Industry Tag */}
              <View className="flex-row items-center px-3 py-1.5 bg-blue-50 border border-blue-300 rounded-full ml-2">
                <Text className="text-xs text-blue-700">
                  {companyData.industry}
                </Text>
              </View>
              {/* Country Tag */}
              <View className="flex-row items-center px-3 py-1.5 bg-green-50 border border-green-300 rounded-full ml-2">
                <Text className="text-xs text-green-700">
                  {companyData.country}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text className="text-sm text-neutral-700 leading-5">
            {companyData.description}
          </Text>
        </View>

        {/* Event Offers Section */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-light text-neutral-900 mb-3">
            Event Offers
          </Text>
          <View className="flex-row gap-3">
            {companyData.eventOffers.map((offer) => (
              <Pressable
                key={offer.id}
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: offer.color,
                  minHeight: 120,
                }}
              >
                <Text className="text-white font-bold text-base mb-2">
                  {offer.title}
                </Text>
                <View className="flex-row items-center mt-auto">
                  <Text className="text-white text-sm mr-1">Redeem</Text>
                  <ArrowUpRightIcon size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Social Links Section */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-light text-neutral-900 mb-3">
            Social Links
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {(() => {
              // Split socialLinks into rows of 2
              const rows = [];
              const links = companyData.socialLinks;
              for (let i = 0; i < links.length; i += 2) {
                rows.push(links.slice(i, i + 2));
              }
              return rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  className="flex-row justify-between mb-2"
                  style={{ width: "100%" }}
                >
                  {row.map((social, colIndex) => {
                    const IconComponent = social.icon;
                    return (
                      <Pressable
                        key={social.id}
                        className="flex-row items-center px-3 py-2 bg-white border border-neutral-300 rounded-full"
                        style={{
                          width: "48%",
                          marginRight:
                            colIndex === 0 && row.length === 2 ? "4%" : 0,
                        }}
                      >
                        <IconComponent size={16} color={social.color} />
                        <Text
                          className="text-xs text-neutral-900 ml-2 flex-1"
                          numberOfLines={1}
                        >
                          {social.handle}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {row.length === 1 && (
                    // Fill the remaining column if odd
                    <View style={{ width: "48%" }} />
                  )}
                </View>
              ));
            })()}
          </View>
        </View>

        {/* Open Positions Section */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-light text-neutral-900 mb-3">
            Open Positions
          </Text>
          <View className="gap-2">
            {companyData.openPositions.map((position) => (
              <Pressable
                key={position.id}
                className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                onPress={() => {
                  // TODO: Navigate to position details
                  console.log(`View position: ${position.title}`);
                }}
              >
                <Text className="text-sm font-bold text-neutral-900 flex-1">
                  {position.title}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-neutral-600 mr-1">View</Text>
                  <ArrowUpRightIcon size={14} color="#404040" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Meet Our Team Section */}
        {/* <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-neutral-900 mb-3">
            Meet Our Team ({companyData.teamMembers.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {companyData.teamMembers.map((member) => (
              <View key={member.id} className="items-center mr-4">
                <View className="w-16 h-16 rounded-full bg-neutral-200 items-center justify-center mb-2">
                  <Text className="text-neutral-500 text-2xl">👤</Text>
                </View>
                <Text className="text-xs text-neutral-600 text-center">
                  {member.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View> */}
      </ScrollView>

      {/* Action Button */}
      <SafeAreaView
        edges={["bottom"]}
        className="bg-white border-t border-neutral-200"
      >
        <View className="px-4 pt-4 pb-2">
          <Pressable
            className="bg-neutral-900 rounded-xl py-4 items-center flex-row justify-center"
            onPress={() => {
              setIsRequestMeetingModalVisible(true);
            }}
          >
            <CalendarIconWhite size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white ml-2">
              Request Meeting
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => setIsRequestMeetingModalVisible(false)}
        onSubmit={(data: MeetingFormData) => {
          console.log("Meeting Request Submitted:", data);
          // Mark checklist item as completed when user submits meeting request
          markRequestMeetingComplete();
          // Show meeting request message modal
          setMeetingRequestData({
            attendeeName: name,
            meetingType: data.meetingType,
            meetingTitle: data.title || "Meeting",
          });
          setIsRequestMeetingModalVisible(false);
          setIsMeetingRequestMessageVisible(true);
          // TODO: Send meeting request to backend
        }}
        attendeeName={name}
      />

      {/* Meeting Request Message Modal */}
      <MeetingRequestMessageModal
        visible={isMeetingRequestMessageVisible}
        onClose={() => {
          setIsMeetingRequestMessageVisible(false);
          setMeetingRequestData(null);
        }}
        attendeeName={meetingRequestData?.attendeeName}
        meetingType={meetingRequestData?.meetingType}
        meetingTitle={meetingRequestData?.meetingTitle}
      />
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
