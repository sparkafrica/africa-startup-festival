import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  Alert,
  Linking,
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
import { meetingService } from "../services/meetingService";
import { eventService, type Company } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";

// ============================================
// MODAL HEIGHT CONFIGURATION
// Change this value to adjust modal height (0.0 to 1.0)
// Example: 0.7 = 70%, 0.8 = 80%, 0.9 = 90%
// ============================================
const MODAL_HEIGHT_PERCENTAGE = 0.95;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * MODAL_HEIGHT_PERCENTAGE;
const DRAG_THRESHOLD = 100;

// UI shape for company detail display
type CompanyUIData = {
  name: string;
  logo: { uri: string } | null;
  logoColor: string;
  booth: string;
  website: string;
  websiteUrl: string; // full URL for opening (e.g. https://www.ods.com)
  industry: string;
  country: string;
  description: string;
  eventOffers: { id: string; title: string; color: string; link?: string }[];
  socialLinks: { id: string; platform: string; handle: string; url: string; icon: any; color: string }[];
  teamMembers: { id: string; name: string }[];
  openPositions: { id: string; title: string; link?: string }[];
};

const COLORS = ["#2762C7", "#1E40AF", "#3B82F6", "#9333EA", "#22C55E", "#E91E63", "#FFC107", "#DC2626"];
const OFFER_COLORS = ["#6B21A8", "#22C55E", "#3B82F6", "#E91E63"];

function ensureHttps(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function buildSocialUrl(platform: string, handle: string): string {
  const h = String(handle).replace(/^@/, "").trim();
  if (!h) return "";
  const lower = platform.toLowerCase();
  if (lower === "instagram") return `https://instagram.com/${h}`;
  if (lower === "x" || lower === "twitter") return `https://x.com/${h}`;
  if (lower === "facebook") return `https://facebook.com/${h}`;
  if (lower === "linkedin") {
    if (h.startsWith("http")) return ensureHttps(h);
    return `https://linkedin.com/in/${h.replace(/^\//, "")}`;
  }
  return "";
}

// Map Company (from GET /directory/{event_id}/{company_type}/{company_pk}/) to UI data
function mapCompanyToUIData(company: Company): CompanyUIData {
  const name = company.name || "Company";
  const logoColor = COLORS[(name?.length || 0) % COLORS.length];
  const meta = company.metadata || {};
  const websiteRaw = meta.website ?? meta.company_website ?? "—";
  const websiteUrl = websiteRaw !== "—" ? ensureHttps(websiteRaw) : "";

  const offers = (meta.offers || []).map((o: any, i: number) => ({
    id: String(o.id ?? i),
    title: o.title || "Offer",
    color: o.color || OFFER_COLORS[i % OFFER_COLORS.length],
    link: o.link ? ensureHttps(o.link) : websiteUrl || undefined,
  }));

  const socialMap: Record<string, { icon: any; color: string }> = {
    facebook: { icon: FacebookIcon, color: "#1877F2" },
    twitter: { icon: TwitterIcon, color: "#000000" },
    x: { icon: TwitterIcon, color: "#000000" },
    instagram: { icon: InstagramIcon, color: "#000000" },
    linkedin: { icon: LinkedInIcon, color: "#0A66C2" },
  };
  const socialLinks: CompanyUIData["socialLinks"] = [];
  const rawLinks = meta.social_links || meta.socialLinks || {};
  if (typeof rawLinks === "object") {
    for (const [platform, handle] of Object.entries(rawLinks)) {
      if (handle && socialMap[platform.toLowerCase()]) {
        const { icon, color } = socialMap[platform.toLowerCase()];
        const url = buildSocialUrl(platform, String(handle));
        socialLinks.push({
          id: platform,
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          handle: String(handle),
          url,
          icon,
          color,
        });
      }
    }
  }
  if (meta.linkedin && !socialLinks.find((s) => s.id === "linkedin")) {
    const linkedInVal = String(meta.linkedin);
    const url = buildSocialUrl("linkedin", linkedInVal);
    socialLinks.push({
      id: "linkedin",
      platform: "LinkedIn",
      handle: linkedInVal.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "").trim() || "Profile",
      url: url || ensureHttps(linkedInVal),
      icon: LinkedInIcon,
      color: "#0A66C2",
    });
  }
  const teamMembers = (company.members || []).map((m) => ({
    id: m.id,
    name: `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Team Member",
  }));
  const positionsRaw = meta.open_positions || meta.positions || [];
  const openPositions = positionsRaw.map((p: any, i: number) => ({
    id: String(p.id ?? i),
    title: p.title || p.role || "Position",
    link: p.link ? ensureHttps(p.link) : undefined,
  }));
  const boothValue = meta.booth ?? meta.boothNumber ?? (company as any).booth_info?.booth_number ?? "—";
  return {
    name,
    logo: company.logo ? { uri: company.logo } : null,
    logoColor,
    booth: boothValue,
    website: websiteRaw,
    websiteUrl,
    industry: company.company_sector ?? "—",
    country: company.country ?? "—",
    description: company.company_description ?? "",
    eventOffers: offers,
    socialLinks: socialLinks.length > 0 ? socialLinks : [
      { id: "linkedin", platform: "LinkedIn", handle: "Profile", url: "", icon: LinkedInIcon, color: "#0A66C2" },
    ],
    teamMembers,
    openPositions,
  };
}

const DEFAULT_COMPANY_DATA: CompanyUIData = {
  name: "Company",
  logo: null,
  logoColor: "#1E40AF",
  booth: "—",
  website: "—",
  websiteUrl: "",
  industry: "—",
  country: "—",
  description: "No description available.",
  eventOffers: [],
  socialLinks: [{ id: "linkedin", platform: "LinkedIn", handle: "Profile", url: "", icon: LinkedInIcon, color: "#0A66C2" }],
  teamMembers: [],
  openPositions: [],
};

type Props = RootStackScreenProps<"CompanyDetail">;

export default function CompanyDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp<any>>();
  const { exhibitorId, type = "exhibitor", name: paramName } = route.params;
  const displayName = paramName || "Company";
  const { markRequestMeetingComplete } = useChecklist();

  const [companyData, setCompanyData] = useState<CompanyUIData>(() => ({
    ...DEFAULT_COMPANY_DATA,
    name: displayName,
    logoColor: COLORS[(displayName?.length || 0) % COLORS.length],
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const openUrl = useCallback(async (url: string) => {
    if (!url || !url.trim()) return;
    try {
      const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      const supported = await Linking.canOpenURL(formatted);
      if (supported) {
        await Linking.openURL(formatted);
      } else {
        try {
          await Linking.openURL(formatted);
        } catch {
          Alert.alert("Cannot Open Link", "This link could not be opened.");
        }
      }
    } catch {
      Alert.alert("Error", "Failed to open link.");
    }
  }, []);

  const fetchCompany = useCallback(async () => {
    const companyPk = parseInt(exhibitorId, 10);
    if (isNaN(companyPk) || companyPk < 1) {
      setCompanyData((prev) => ({ ...prev, name: displayName }));
      setAdminUserId(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const company = await eventService.getCompanyDetail(EVENT_ID, type, companyPk);
      const mapped = mapCompanyToUIData(company);
      setCompanyData(mapped);
      setAdminUserId(company.admin_user ?? null);
    } catch (err: any) {
      const msg = err instanceof ApiClientError ? err.message : err?.message || "Failed to load company";
      setLoadError(msg);
      setCompanyData((prev) => ({ ...prev, name: displayName }));
      setAdminUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, [exhibitorId, type, displayName]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

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

  // Animation for drag-to-close
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);

  // PanResponder for drag-to-close functionality - only on handle area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Only start if not animating and scroll is at top
        return !isAnimating.current && scrollOffset.current <= 5;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond if scrolling is at top and gesture is clearly downward
        return (
          !isAnimating.current &&
          scrollOffset.current <= 5 &&
          Math.abs(gestureState.dy) > 8 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (isAnimating.current) return;
        translateY.stopAnimation();
        const currentValue = (translateY as any)._value || 0;
        translateY.setOffset(currentValue);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;
        // Only allow dragging down, with resistance at the top
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;
        translateY.flattenOffset();
        const currentValue = (translateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          isAnimating.current = true;
          Animated.timing(translateY, {
            toValue: MODAL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            isAnimating.current = false;
            navigation.goBack();
          });
        } else {
          isAnimating.current = true;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start(() => {
            isAnimating.current = false;
          });
        }
      },
    })
  ).current;


  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Draggable Handle - at the very top */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
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
            {isLoading && (
              <View className="flex-1 items-end">
                <ActivityIndicator size="small" color="#000" />
              </View>
            )}
          </View>

          {/* Company Header */}
          <View className="px-4 mb-6" style={{ marginTop: 8 }}>
          <View className="flex-row items-center mb-4">
            {/* Logo - circular, matches mock */}
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-3 overflow-hidden"
              style={{ backgroundColor: companyData.logoColor }}
            >
              {companyData.logo ? (
                <Image
                  source={companyData.logo}
                  style={{ width: 64, height: 64 }}
                  resizeMode="cover"
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

          {/* Tags - website + industry/country pills, matches mock */}
          <View className="flex-row flex-wrap items-center gap-2 mb-4">
            <Pressable
              className="flex-row items-center px-3 py-1.5 bg-white border border-neutral-300 rounded-full"
              onPress={() => companyData.websiteUrl && openUrl(companyData.websiteUrl)}
            >
              <GlobeIcon size={14} color="#000000" />
              <Text className="text-xs text-neutral-900 ml-1.5" numberOfLines={1}>
                {companyData.website}
              </Text>
            </Pressable>
            {companyData.industry !== "—" && (
              <View className="flex-row items-center px-3 py-1.5 bg-blue-50 border border-blue-300 rounded-full">
                <Text className="text-xs text-blue-700">{companyData.industry}</Text>
              </View>
            )}
            {companyData.country !== "—" && (
              <View className="flex-row items-center px-3 py-1.5 bg-green-50 border border-green-300 rounded-full">
                <Text className="text-xs text-green-700">{companyData.country}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text className="text-sm text-neutral-700 leading-5">
            {companyData.description}
          </Text>
        </View>

        {/* Event Offers Section - 2 per row, matches mock */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-light text-neutral-900 mb-3">
            Event Offers
          </Text>
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
            {companyData.eventOffers.map((offer) => (
              <View key={offer.id} style={{ width: "50%", padding: 6 }}>
                <Pressable
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: offer.color,
                    minHeight: 120,
                  }}
                  onPress={() => offer.link && openUrl(offer.link)}
                >
                  <Text className="text-white font-bold text-base mb-2" numberOfLines={2}>
                    {offer.title.trim()}
                  </Text>
                  <View className="flex-row items-center mt-auto">
                    <Text className="text-white text-sm mr-1">Redeem</Text>
                    <ArrowUpRightIcon size={14} color="#FFFFFF" />
                  </View>
                </Pressable>
              </View>
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
                        onPress={() => social.url && openUrl(social.url)}
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

        {/* Open Positions Section - matches mock */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-light text-neutral-900 mb-3">
            Open Positions
          </Text>
          {companyData.openPositions.length === 0 ? (
            <Text className="text-sm text-neutral-500">No open positions listed.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {companyData.openPositions.map((position) => (
                <Pressable
                  key={position.id}
                  className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  onPress={() => position.link && openUrl(position.link)}
                >
                  <Text className="text-sm font-bold text-neutral-900 flex-1" numberOfLines={1}>
                    {position.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-neutral-600 mr-1">View</Text>
                    <ArrowUpRightIcon size={14} color="#404040" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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

      {/* Action Button - Fixed at bottom */}
      <SafeAreaView
        edges={["bottom"]}
        style={styles.buttonContainer}
      >
        <View className="px-4 pt-4 pb-4">
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
      </Animated.View>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => setIsRequestMeetingModalVisible(false)}
        onSubmit={async (data: MeetingFormData) => {
          // Backend: meeting request goes to the admin of the company.
          if (!adminUserId) {
            Alert.alert(
              "Cannot Request Meeting",
              "This company has no contact available for meeting requests. Try connecting via Attendees or Connections instead."
            );
            throw new Error("No company admin user");
          }
          try {
            await meetingService.submitMeetingRequestFromForm(
              EVENT_ID,
              data,
              adminUserId
            );
            markRequestMeetingComplete();
            setMeetingRequestData({
              attendeeName: companyData.name,
              meetingType: data.meetingType,
              meetingTitle: data.title || "Meeting",
            });
            setIsRequestMeetingModalVisible(false);
            setIsMeetingRequestMessageVisible(true);
          } catch (e: any) {
            const msg =
              e instanceof ApiClientError
                ? e.message
                : e?.message || "Failed to send meeting request. Please try again.";
            Alert.alert("Error", msg);
            throw e;
          }
        }}
        attendeeName={displayName}
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
  buttonContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
