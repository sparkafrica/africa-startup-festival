import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Component,
} from "react";
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
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
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
  LoadingSpinner,
  type MeetingFormData,
} from "../components";
import { useChecklist } from "../context/ChecklistContext";
import { useAuth } from "../context/AuthContext";
import { meetingService } from "../services/meetingService";
import { eventService, type Company } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { isPostEventMode } from "../config/eventMode";
import { brand, typography } from "../theme/theme";
import {
  PROFILE_LINK_BLUE,
  PROFILE_TAG_COLORS,
  type ProfileTagKind,
} from "../constants/profileTagColors";
import { ApiClientError } from "../services/api";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
} from "../utils/meetingRestrictions";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import { normalizeFoundersForDisplay } from "../utils/founderUtils";
import { trackMeetingEvent } from "../utils/analytics";

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
  websiteUrl: string;
  industry: string;
  country: string;
  growthStage: string;
  yearFounded: string;
  description: string;
  problem: string;
  solution: string;
  pitchDeckUrl: string;
  companyType: string;
  eventOffers: { id: string; title: string; color: string; link?: string }[];
  socialLinks: {
    id: string;
    platform: string;
    handle: string;
    url: string;
    icon: any;
    color: string;
  }[];
  teamMembers: { id: string; name: string }[];
  founders: {
    id: string;
    name: string;
    role: string;
    linkedInUrl: string;
    imageUrl: string | null;
  }[];
  openPositions: { id: string; title: string; link?: string }[];
};

const COLORS = [
  "#2762C7",
  "#1E40AF",
  "#3B82F6",
  "#9333EA",
  "#22C55E",
  "#E91E63",
  "#FFC107",
  "#DC2626",
];
const OFFER_COLORS = ["#6B21A8", "#22C55E", "#3B82F6", "#E91E63"];

/**
 * Spotlight section title.
 * Must use InterDisplay-Bold via fontFamily — do NOT set fontWeight with it
 * (RN often drops back to Regular when weight ≠ the loaded face).
 */
function ProfileSectionHeader({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: typography.fontFamily["inter-bold"],
        fontSize: 14,
        color: brand.black,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

/** Spotlight fact cell — labeled country / stage / sector / year. */
function ProfileFact({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: ProfileTagKind;
}) {
  if (!value || value === "—") return null;
  const valueColor = PROFILE_TAG_COLORS[kind].text;
  return (
    <View className="mb-3" style={{ width: "48%" }}>
      <Text
        style={{
          fontFamily: typography.fontFamily["inter-bold"],
          fontSize: 10,
          color: brand.black,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily["inter-bold"],
          fontSize: 16,
          color: valueColor,
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ensureHttps(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
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
function mapCompanyToUIData(
  company: Company | null | undefined,
): CompanyUIData {
  if (!company || typeof company !== "object") {
    return { ...DEFAULT_COMPANY_DATA };
  }
  const name = company.name || "Company";
  const logoColor = COLORS[(name?.length || 0) % COLORS.length];
  let meta: Record<string, any> = {};
  if (company.metadata && typeof company.metadata === "object") {
    meta = company.metadata;
  } else if (typeof company.metadata === "string") {
    try {
      meta = JSON.parse(company.metadata) as Record<string, any>;
    } catch {
      meta = {};
    }
  }
  const websiteRaw = meta.website ?? meta.company_website ?? "—";
  const websiteUrl = websiteRaw !== "—" ? ensureHttps(String(websiteRaw)) : "";

  const offersRaw = Array.isArray(meta.offers) ? meta.offers : [];
  const offers = offersRaw.map((o: any, i: number) => ({
    id: String(o?.id ?? i),
    title: (o?.title ?? "Offer").toString().trim() || "Offer",
    color: o?.color || OFFER_COLORS[i % OFFER_COLORS.length],
    link: o?.link ? ensureHttps(String(o.link)) : websiteUrl || undefined,
  }));

  const socialMap: Record<string, { icon: any; color: string }> = {
    facebook: { icon: FacebookIcon, color: "#1877F2" },
    twitter: { icon: TwitterIcon, color: brand.black },
    x: { icon: TwitterIcon, color: brand.black },
    instagram: { icon: InstagramIcon, color: brand.black },
    linkedin: { icon: LinkedInIcon, color: "#0A66C2" },
  };
  const socialLinks: CompanyUIData["socialLinks"] = [];
  const rawLinks = meta.social_links || meta.socialLinks || {};
  if (typeof rawLinks === "object" && rawLinks !== null) {
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
    const linkedInVal = String(meta.linkedin).trim();
    const linkedInInfo = getLinkedInDisplayInfo(linkedInVal);
    if (linkedInInfo) {
      socialLinks.push({
        id: "linkedin",
        platform: "LinkedIn",
        handle: linkedInInfo.displayLabel,
        url: linkedInInfo.url,
        icon: LinkedInIcon,
        color: "#0A66C2",
      });
    }
  }
  const membersRaw = Array.isArray(company.members) ? company.members : [];
  const teamMembers = membersRaw.map((m: any, i: number) => ({
    id: String(m?.id ?? i),
    name:
      `${m?.first_name ?? ""} ${m?.last_name ?? ""}`.trim() || "Team Member",
  }));
  const founders = normalizeFoundersForDisplay({
    founders: company.founders,
    metadata: meta,
  });
  const positionsRaw = Array.isArray(meta.open_positions)
    ? meta.open_positions
    : Array.isArray(meta.positions)
      ? meta.positions
      : [];
  const openPositions = positionsRaw.map((p: any, i: number) => ({
    id: String(p?.id ?? i),
    title: (p?.title ?? p?.role ?? "Position").toString().trim() || "Position",
    link: p?.link ? ensureHttps(String(p.link)) : undefined,
  }));
  const boothValue =
    meta.booth ??
    meta.boothNumber ??
    (company as any).booth_info?.booth_number ??
    "—";
  const companyType = String(
    company.company_type ?? meta.company_type ?? "",
  ).toLowerCase();
  const problem =
    typeof meta.problem === "string" && meta.problem.trim()
      ? meta.problem.trim()
      : "";
  const solution =
    typeof meta.solution === "string" && meta.solution.trim()
      ? meta.solution.trim()
      : "";
  const pitchDeckRaw = meta.pitch_deck_url ?? meta.pitchDeckUrl;
  const pitchDeckUrl =
    typeof pitchDeckRaw === "string" && pitchDeckRaw.trim()
      ? ensureHttps(pitchDeckRaw.trim())
      : "";
  const growthStage =
    typeof meta.growth_stage === "string" && meta.growth_stage.trim()
      ? meta.growth_stage.trim()
      : "—";
  const yearFoundedRaw = meta.year_founded;
  const yearFounded =
    yearFoundedRaw != null && String(yearFoundedRaw).trim()
      ? String(yearFoundedRaw).trim()
      : "—";

  let logo: { uri: string } | null = null;
  if (company.logo) {
    if (typeof company.logo === "string") {
      logo = { uri: company.logo };
    } else if (
      typeof company.logo === "object" &&
      company.logo !== null &&
      "url" in company.logo
    ) {
      const url = (company.logo as { url?: string }).url;
      if (typeof url === "string" && url) logo = { uri: url };
    }
  }

  return {
    name,
    logo,
    logoColor,
    booth: boothValue,
    website: websiteRaw,
    websiteUrl,
    industry: company.company_sector ?? "—",
    country: company.country ?? "—",
    growthStage,
    yearFounded,
    description: company.company_description ?? "",
    problem,
    solution,
    pitchDeckUrl,
    companyType,
    eventOffers: offers,
    socialLinks:
      socialLinks.length > 0
        ? socialLinks
        : [
            {
              id: "linkedin",
              platform: "LinkedIn",
              handle: "Profile",
              url: "",
              icon: LinkedInIcon,
              color: "#0A66C2",
            },
          ],
    teamMembers,
    founders,
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
  growthStage: "—",
  yearFounded: "—",
  description: "No description available.",
  problem: "",
  solution: "",
  pitchDeckUrl: "",
  companyType: "",
  eventOffers: [],
  socialLinks: [
    {
      id: "linkedin",
      platform: "LinkedIn",
      handle: "Profile",
      url: "",
      icon: LinkedInIcon,
      color: "#0A66C2",
    },
  ],
  teamMembers: [],
  founders: [],
  openPositions: [],
};

type Props = RootStackScreenProps<"CompanyDetail">;

// ErrorBoundary to catch render crashes (only logs when error occurs)
class CompanyDetailErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error(
        "[CompanyDetail] Render error:",
        error,
        errorInfo.componentStack,
      );
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (__DEV__) {
        return (
          <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <Text style={{ color: "red", marginBottom: 8 }}>
              CompanyDetail crashed (dev only)
            </Text>
            <Text style={{ fontSize: 12 }}>{String(this.state.error)}</Text>
          </View>
        );
      }
      return null;
    }
    return this.props.children;
  }
}

function CompanyDetailScreenInner({ route }: Props) {
  const navigation = useNavigation<Props["navigation"]>();
  const { exhibitorId, type = "exhibitor", name: paramName } = route.params;
  const displayName = paramName || "Company";
  const { markRequestMeetingComplete } = useChecklist();
  const { user } = useAuth();

  const [companyData, setCompanyData] = useState<CompanyUIData>(() => ({
    ...DEFAULT_COMPANY_DATA,
    name: displayName,
    logoColor: COLORS[(displayName?.length || 0) % COLORS.length],
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  const openUrl = useCallback(async (url: string) => {
    if (!url || !url.trim()) return;
    try {
      const formatted =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
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
      setCompanyId(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const company = await eventService.getCompanyDetail(
        EVENT_ID,
        type,
        companyPk,
      );
      const mapped = mapCompanyToUIData(company ?? null);
      setCompanyData(mapped);
      setAdminUserId((company as any)?.admin_user ?? null);
      setCompanyId(company?.id ?? companyPk);
    } catch (err: any) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err?.message || "Failed to load company";
      setLoadError(msg);
      setCompanyData((prev) => ({ ...prev, name: displayName }));
      setAdminUserId(null);
      setCompanyId(null);
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
    }),
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
          {/* Back Button - extra top padding so it's not cramped under the handle on all mobile screens */}
          <View className="flex-row items-center px-4 pt-5 pb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-3 flex-row items-center p-1"
              hitSlop={12}
            >
              <ChevronLeftIcon size={28} color={brand.black} />
            </Pressable>
            {isLoading && (
              <View className="flex-1 items-end">
                <LoadingSpinner size="small" color={brand.black} />
              </View>
            )}
          </View>

          {/* Company Header */}
          <View className="px-4 mb-6" style={{ marginTop: 8 }}>
            <View className="flex-row items-center mb-4">
              {/* Logo — contain on tile; no inner fill so mark sits on page background */}
              <View
                className="w-16 h-16 items-center justify-center mr-3 overflow-hidden"
                style={{
                  borderRadius: 0,
                  backgroundColor: companyData.logo
                    ? "transparent"
                    : companyData.logoColor,
                }}
              >
                {companyData.logo ? (
                  <Image
                    source={companyData.logo}
                    style={{ width: 64, height: 64, borderRadius: 0 }}
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
                <Text
                  className="text-2xl font-bold mb-1"
                  style={{ color: brand.black }}
                >
                  {companyData.name}
                </Text>
                {companyData.companyType !== "startup" &&
                companyData.booth &&
                companyData.booth !== "—" ? (
                  <Pressable className="flex-row items-center">
                    <Text
                      className="text-sm mr-1"
                      style={{ color: brand.black }}
                    >
                      Booth {companyData.booth}
                    </Text>
                    <ArrowUpRightIcon size={14} color={brand.black} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Website + spotlight facts */}
            <View className="mb-5">
              <Pressable
                className="flex-row items-center self-start px-3 py-2 bg-white border border-black mb-4"
                style={{ borderRadius: 0 }}
                onPress={() =>
                  companyData.websiteUrl && openUrl(companyData.websiteUrl)
                }
              >
                <GlobeIcon size={14} color={brand.black} />
                <Text
                  className="text-xs font-medium ml-1.5"
                  style={{ color: brand.black }}
                  numberOfLines={1}
                >
                  {companyData.website}
                </Text>
              </Pressable>

              <View
                className="flex-row flex-wrap justify-between border border-neutral-200 bg-neutral-50 px-3.5 pt-3.5 pb-1"
                style={{ borderRadius: 0 }}
              >
                <ProfileFact
                  label="Country"
                  value={companyData.country}
                  kind="country"
                />
                <ProfileFact
                  label="Growth stage"
                  value={companyData.growthStage}
                  kind="growth"
                />
                <ProfileFact
                  label="Sector"
                  value={companyData.industry}
                  kind="industry"
                />
                <ProfileFact
                  label="Year founded"
                  value={companyData.yearFounded}
                  kind="year"
                />
              </View>
            </View>

            {/* Description */}
            {companyData.problem ? (
              <View className="mb-3">
                <ProfileSectionHeader>The problem</ProfileSectionHeader>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontSize: 15,
                    lineHeight: 24,
                    color: "#525252",
                  }}
                >
                  {companyData.problem}
                </Text>
              </View>
            ) : null}
            {companyData.solution ? (
              <View className="mb-3">
                <ProfileSectionHeader>The solution</ProfileSectionHeader>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontSize: 15,
                    lineHeight: 24,
                    color: "#525252",
                  }}
                >
                  {companyData.solution}
                </Text>
              </View>
            ) : null}
            {companyData.description ? (
              <View className="mb-3">
                <ProfileSectionHeader>About us</ProfileSectionHeader>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontSize: 15,
                    lineHeight: 24,
                    color: "#525252",
                  }}
                >
                  {companyData.description}
                </Text>
              </View>
            ) : null}
            {companyData.pitchDeckUrl ? (
              <Pressable
                className="mt-1 mb-2 flex-row items-center"
                onPress={() => openUrl(companyData.pitchDeckUrl)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: PROFILE_LINK_BLUE }}
                >
                  View Pitch Deck
                </Text>
                <ArrowUpRightIcon size={14} color={PROFILE_LINK_BLUE} />
              </Pressable>
            ) : null}

          {companyData.founders.length > 0 ? (
            <View className="mt-3 mb-2">
              <ProfileSectionHeader>Founders</ProfileSectionHeader>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8, paddingTop: 4 }}
              >
                {companyData.founders.map((founder) => (
                  <Pressable
                    key={founder.id}
                    className="mr-3 w-36 border border-neutral-200 bg-white p-3 items-center"
                    onPress={() =>
                      founder.linkedInUrl
                        ? openUrl(founder.linkedInUrl)
                        : undefined
                    }
                    style={{
                      borderRadius: 0,
                      shadowColor: brand.black,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    {founder.imageUrl ? (
                      <Image
                        source={{ uri: founder.imageUrl }}
                        className="w-16 h-16 rounded-full mb-2 bg-neutral-100"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-full mb-2 bg-neutral-200 items-center justify-center">
                        <Text
                          className="font-semibold text-xl"
                          style={{ color: brand.black }}
                        >
                          {founder.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      className="text-sm font-semibold text-center"
                      style={{ color: brand.black }}
                      numberOfLines={2}
                    >
                      {founder.name}
                    </Text>
                    {founder.role ? (
                      <Text
                        className="text-xs text-center mt-1 text-neutral-600"
                        numberOfLines={2}
                      >
                        {founder.role}
                      </Text>
                    ) : null}
                    {founder.linkedInUrl ? (
                      <Text
                        className="text-[11px] font-medium mt-2"
                        style={{ color: PROFILE_LINK_BLUE }}
                      >
                        LinkedIn ↗
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

          {/* Event Offers Section - 2 per row, title up to 2 lines then truncate with … */}
          <View className="px-4 mb-4">
            <ProfileSectionHeader>Event Offers</ProfileSectionHeader>
            {companyData.eventOffers.length === 0 ? (
              <Text className="text-sm text-neutral-500 py-2">
                No event offers at the moment.
              </Text>
            ) : (
              <View
                className="flex-row flex-wrap"
                style={{ marginHorizontal: -6 }}
              >
                {companyData.eventOffers.map((offer) => (
                  <View key={offer.id} style={{ width: "50%", padding: 6 }}>
                    <Pressable
                      className="p-4"
                      style={{
                        borderRadius: 0,
                        backgroundColor: offer.color,
                        minHeight: 120,
                      }}
                      onPress={() => offer.link && openUrl(offer.link)}
                    >
                      <Text
                        className="text-white font-bold text-base mb-2"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {(offer.title ?? "").trim() || "Offer"}
                      </Text>
                      <View className="flex-row items-center mt-auto">
                        <Text className="text-white text-sm mr-1">Redeem</Text>
                        <ArrowUpRightIcon size={14} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Social Links Section */}
          <View className="px-4 mb-4">
            <ProfileSectionHeader>Social Links</ProfileSectionHeader>
            <View className="flex-row flex-wrap justify-start">
              {companyData.socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Pressable
                    key={social.id}
                    className="flex-row items-center self-start px-3 py-2 mr-2 mb-2 bg-white border border-black"
                    style={{ borderRadius: 0 }}
                    onPress={() => social.url && openUrl(social.url)}
                  >
                    <IconComponent size={16} color={brand.black} />
                    <Text
                      className="text-xs ml-2 font-medium"
                      style={{ color: brand.black }}
                      numberOfLines={1}
                    >
                      {social.handle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Open Positions Section - matches mock */}
          <View className="px-4 mb-4">
            <ProfileSectionHeader>Open Positions</ProfileSectionHeader>
            {companyData.openPositions.length === 0 ? (
              <Text className="text-sm text-neutral-500 py-2">
                No open positions at the moment.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {companyData.openPositions.map((position) => (
                  <Pressable
                    key={position.id}
                    className="bg-white border border-black px-4 py-3 flex-row items-center justify-between"
                    style={{ borderRadius: 0 }}
                    onPress={() => position.link && openUrl(position.link)}
                  >
                    <Text
                      className="text-sm font-bold flex-1"
                      style={{ color: brand.black }}
                      numberOfLines={1}
                    >
                      {position.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm mr-1"
                        style={{ color: brand.black }}
                      >
                        View
                      </Text>
                      <ArrowUpRightIcon size={14} color={brand.black} />
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
        <SafeAreaView edges={["bottom"]} style={styles.buttonContainer}>
          <View className="px-4 pt-4 pb-4">
            {(() => {
              const isOwnStartup =
                (adminUserId != null &&
                  user?.user_id != null &&
                  String(adminUserId) === String(user.user_id)) ||
                (companyId != null &&
                  user?.company?.id != null &&
                  Number(user.company.id) === Number(companyId));

              if (isOwnStartup) {
                return (
                  <View
                    className="bg-neutral-100 border border-neutral-200 py-4 items-center"
                    style={{ borderRadius: 0 }}
                  >
                    <Text className="text-sm font-medium text-neutral-600">
                      This is your startup
                    </Text>
                  </View>
                );
              }

              return (
                <Pressable
                  className="py-4 items-center flex-row justify-center"
                  style={{
                    borderRadius: 0,
                    backgroundColor: brand.black,
                    opacity: isSubmittingMeeting ? 0.7 : 1,
                  }}
                  disabled={isSubmittingMeeting}
                  onPress={async () => {
                    const canBook = await getCanUserBookMeetings();
                    if (canBook) setIsRequestMeetingModalVisible(true);
                    else showExpoCannotBookMeetingAlert(navigation);
                  }}
                >
                  {isSubmittingMeeting ? (
                    <LoadingSpinner size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CalendarIconWhite size={20} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        Request Meeting
                      </Text>
                    </>
                  )}
                </Pressable>
              );
            })()}
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        analyticsSource="company_detail_screen"
        onClose={() => setIsRequestMeetingModalVisible(false)}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        virtualOnly={isPostEventMode()}
        onSubmit={async (data: MeetingFormData) => {
          if (isPostEventMode() && data.meetingType === "Physical") {
            Alert.alert(
              "Virtual meetings only",
              "Africa Startup Festival has ended — only virtual meetings are available.",
            );
            return;
          }
          // Backend: meeting request goes to the admin of the company.
          if (!adminUserId) {
            Alert.alert(
              "Cannot Request Meeting",
              "This company has no contact available for meeting requests. Try connecting via Attendees or Connections instead.",
            );
            throw new Error("No company admin user");
          }
          setIsSubmittingMeeting(true);
          try {
            await meetingService.submitMeetingRequestFromForm(
              EVENT_ID,
              data,
              adminUserId,
            );
            void trackMeetingEvent("request_submitted", {
              source: "company_detail_screen",
            });
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
                : e?.message ||
                  "Failed to send meeting request. Please try again.";
            Alert.alert("Error", msg);
            throw e;
          } finally {
            setIsSubmittingMeeting(false);
          }
        }}
        attendeeName={displayName}
        requesteeUserId={adminUserId ?? undefined}
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

export default function CompanyDetailScreen(props: Props) {
  return (
    <CompanyDetailErrorBoundary>
      <CompanyDetailScreenInner {...props} />
    </CompanyDetailErrorBoundary>
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
