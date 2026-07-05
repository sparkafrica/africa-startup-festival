import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ClockIcon } from "./BottomNavIcons";
import { LocationPinIcon, TableIcon, PersonProfileIcon, ChevronRightIcon } from "./icons";
import { VideoIcon } from "./MenuIcons";
import MeetingLinkPressable from "./MeetingLinkPressable";
import { LinkedInIcon } from "./SocialIcons";
import MeetingAcceptedModal from "./MeetingAcceptedModal";
import MeetingDeclineModal from "./MeetingDeclineModal";
import MeetingCancelledModal from "./MeetingCancelledModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.9; // Maximum height to prevent overflow

interface CheckCircleIconProps {
  size?: number;
  color?: string;
}

function CheckCircleIcon({
  size = 20,
  color = "#FFFFFF",
}: CheckCircleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface XCircleIconProps {
  size?: number;
  color?: string;
}

function XCircleIcon({ size = 20, color = "#EF4444" }: XCircleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9L15 15M15 9L9 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface InboundMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  /** If set, shown as a separate row under location with table icon */
  tableNumber?: string;
  meetingType?: "physical" | "virtual";
  meetingLink?: string;
  participantName: string;
  participantRole: string;
  participantCompany: string;
  description?: string;
  expiresIn?: string; // e.g. "2h", "45m", "Expired"
  onParticipantPress?: () => void;
  onAccept?: () => void;
  onDecline?: (reason?: string) => void;
  // Participant detail props
  showParticipantDetail?: boolean;
  participantTags?: string[];
  participantBio?: string;
  participantInterests?: string[];
  participantSocialLabel?: string;
  participantLinkedInUrl?: string; // Full LinkedIn URL for opening profiles
  participantAvatar?: { uri: string };
  onCloseParticipantDetail?: () => void;
}

export default function InboundMeetingModal({
  visible,
  onClose,
  title,
  date,
  startTime,
  endTime,
  location,
  tableNumber: tableNumberProp,
  meetingType = "physical",
  meetingLink,
  participantName,
  participantRole,
  participantCompany,
  description,
  expiresIn,
  onParticipantPress,
  onAccept,
  onDecline,
  showParticipantDetail = false,
  participantTags = [],
  participantBio,
  participantInterests = [],
  participantSocialLabel,
  participantLinkedInUrl,
  participantAvatar,
  onCloseParticipantDetail,
}: InboundMeetingModalProps) {
  const isVirtual = meetingType === "virtual";
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalHeight = useRef(SCREEN_HEIGHT);
  const hasMeasured = useRef(false);
  const isAnimating = useRef(false);

  // Participant modal drag-to-close
  const participantTranslateY = useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const participantModalHeight = useRef(SCREEN_HEIGHT);
  const participantHasMeasured = useRef(false);
  const participantIsAnimating = useRef(false);

  // State for accept/decline modals
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);
  const [declineReason, setDeclineReason] = useState<string | undefined>(undefined);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !hasMeasured.current) {
      modalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      hasMeasured.current = true;
    }
  };

  useEffect(() => {
    if (visible) {
      // Stop any ongoing animations
      translateY.stopAnimation();
      isAnimating.current = false;

      // Reset measurement state when modal becomes visible
      hasMeasured.current = false;

      // Always start from screen height for consistent animation
      translateY.setValue(SCREEN_HEIGHT);

      // Mark as animating
      isAnimating.current = true;

      // Use setTimeout to ensure layout has completed before animating
      const timer = setTimeout(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start(() => {
          isAnimating.current = false;
        });
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Stop any ongoing animations
      translateY.stopAnimation();
      isAnimating.current = false;
      translateY.setValue(SCREEN_HEIGHT);
      hasMeasured.current = false;
    }
  }, [visible, translateY]);

  // Participant modal layout handler
  const handleParticipantLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !participantHasMeasured.current) {
      participantModalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      participantHasMeasured.current = true;
    }
  };

  // Participant modal visibility effect
  useEffect(() => {
    if (showParticipantDetail) {
      // Stop any ongoing animations
      participantTranslateY.stopAnimation();
      participantIsAnimating.current = false;

      const initialHeight = participantHasMeasured.current
        ? participantModalHeight.current
        : SCREEN_HEIGHT;
      participantTranslateY.setValue(initialHeight);

      // Mark as animating
      participantIsAnimating.current = true;

      Animated.spring(participantTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        participantIsAnimating.current = false;
      });
    } else {
      // Stop any ongoing animations
      participantTranslateY.stopAnimation();
      participantIsAnimating.current = false;
      participantTranslateY.setValue(SCREEN_HEIGHT);
      participantHasMeasured.current = false;
    }
  }, [showParticipantDetail]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isAnimating.current &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (isAnimating.current) return;
        translateY.stopAnimation();
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;
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
            toValue: modalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            isAnimating.current = false;
            onClose();
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

  // Participant modal PanResponder
  const participantPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !participantIsAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !participantIsAnimating.current &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (participantIsAnimating.current) return;
        participantTranslateY.stopAnimation();
        participantTranslateY.setOffset(
          (participantTranslateY as any)._value || 0
        );
        participantTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (participantIsAnimating.current) return;
        if (gestureState.dy > 0) {
          participantTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (participantIsAnimating.current) return;
        participantTranslateY.flattenOffset();
        const currentValue = (participantTranslateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          participantIsAnimating.current = true;
          Animated.timing(participantTranslateY, {
            toValue: participantModalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            participantTranslateY.setValue(0);
            participantIsAnimating.current = false;
            onCloseParticipantDetail?.();
          });
        } else {
          participantIsAnimating.current = true;
          Animated.spring(participantTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start(() => {
            participantIsAnimating.current = false;
          });
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Semi-transparent Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
          onLayout={handleLayout}
        >
          {/* Draggable Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            bounces={true}
          >
            {/* Status Tag */}
            <View style={styles.statusTag}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Pending</Text>
            </View>

            {/* Meeting Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Date and Time */}
            <View style={styles.infoRow}>
              <ClockIcon size={18} color="#404040" />
              <Text style={styles.infoText}>
                {date} • {startTime} - {endTime}
              </Text>
            </View>

            {/* Location or Meeting Link */}
            {isVirtual && meetingLink ? (
              <View style={styles.infoRow}>
                <VideoIcon size={18} color="#404040" />
                <View style={styles.linkWrap}>
                  <MeetingLinkPressable url={meetingLink} />
                </View>
              </View>
            ) : (
              <>
                {location && (
                  <View style={styles.infoRow}>
                    <LocationPinIcon size={18} color="#404040" />
                    <Text style={styles.infoText}>{location}</Text>
                  </View>
                )}
                {tableNumberProp && (
                  <View style={styles.infoRow}>
                    <TableIcon size={18} color="#404040" />
                    <Text style={styles.infoText}>{tableNumberProp}</Text>
                  </View>
                )}
                {!location && !tableNumberProp && (
                  <View style={styles.infoRow}>
                    <LocationPinIcon size={18} color="#404040" />
                    <Text style={styles.infoText}>TBD</Text>
                  </View>
                )}
              </>
            )}

            {/* Participant Card */}
            <TouchableOpacity
              style={styles.participantCard}
              activeOpacity={0.7}
              onPress={() => {
                onParticipantPress?.();
              }}
            >
              <View style={styles.avatarContainer}>
                {participantAvatar ? (
                  <Image
                    source={participantAvatar}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    resizeMode="cover"
                  />
                ) : (
                  <PersonProfileIcon size={24} color="#404040" />
                )}
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participantName}</Text>
                <Text style={styles.participantRole}>
                  {[participantRole, participantCompany].filter(Boolean).join(" • ") || "Participant"}
                </Text>
              </View>
              <ChevronRightIcon size={20} color="#404040" />
            </TouchableOpacity>

            {/* Description Section */}
            {description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            {/* Approval Status Message */}
            {expiresIn !== undefined && (
              <View style={styles.approvalMessage}>
                <Text style={styles.approvalText}>
                  Waiting for your approval.{" "}
                  {expiresIn === "Expired"
                    ? "Expired."
                    : `Expires in ${expiresIn}.`}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <SafeAreaView edges={["bottom"]} style={styles.actionsContainer}>
            <Pressable
              style={styles.acceptButton}
              onPress={() => {
                setShowAcceptedModal(true);
              }}
            >
              <CheckCircleIcon size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </Pressable>
            <Pressable
              style={styles.declineButton}
              onPress={() => {
                setShowDeclineModal(true);
              }}
            >
              <XCircleIcon size={20} color="#EF4444" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
            {/* Leave Feedback Button - Commented out: Only ScheduledMeetingModal should have this */}
            {/* <Pressable
              style={styles.feedbackButton}
              onPress={async () => {
                try {
                  const FEEDBACK_FORM_URL = "https://forms.gle/sfCP4Y9CzEtXTQ7u9";
                  const supported = await Linking.canOpenURL(FEEDBACK_FORM_URL);
                  if (supported) {
                    await Linking.openURL(FEEDBACK_FORM_URL);
                  } else {
                    // Still try to open - might work even if canOpenURL returns false
                    try {
                      await Linking.openURL(FEEDBACK_FORM_URL);
                    } catch (openError) {
                      Alert.alert(
                        "Cannot Open Feedback Form",
                        "Please check your internet connection and try again.",
                        [{ text: "OK" }]
                      );
                    }
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.error("Error opening feedback form:", error);
                  }
                  Alert.alert(
                    "Error",
                    "Failed to open feedback form. Please try again.",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <SpeechBubbleIcon size={20} color="#000000" />
              <Text style={styles.feedbackButtonText}>Leave Feedback</Text>
            </Pressable> */}
          </SafeAreaView>
        </Animated.View>

        {/* Participant Detail Overlay - Renders inside the same Modal */}
        {showParticipantDetail && (
          <View style={styles.participantOverlay}>
            <Pressable
              style={styles.participantBackdrop}
              onPress={onCloseParticipantDetail}
            />
            <Animated.View
              style={[
                styles.participantSheet,
                {
                  transform: [{ translateY: participantTranslateY }],
                },
              ]}
              onLayout={handleParticipantLayout}
            >
              <SafeAreaView
                edges={["bottom"]}
                style={styles.participantSafeArea}
              >
                <View style={styles.participantSheetContainer}>
                  {/* Handle */}
                  <View
                    style={styles.participantHandleContainer}
                    {...participantPanResponder.panHandlers}
                  >
                    <View style={styles.participantHandle} />
                  </View>

                  <ScrollView
                    style={styles.participantContent}
                    contentContainerStyle={styles.participantContentContainer}
                    showsVerticalScrollIndicator={false}
                  >
                  {/* Header: Avatar + Name/Role */}
                  <View style={styles.participantHeaderRow}>
                    <View style={styles.participantAvatarWrapper}>
                      {participantAvatar ? (
                        <Image
                          source={participantAvatar}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <PersonProfileIcon size={28} color="#111827" />
                      )}
                    </View>
                      <View style={styles.participantHeaderTextContainer}>
                        <Text style={styles.participantNameText}>
                          {participantName}
                        </Text>
                        <Text style={styles.participantRoleText}>
                          {participantRole}
                          {participantCompany ? ` · ${participantCompany}` : ""}
                        </Text>
                      </View>
                    </View>

                    {/* Tags */}
                    {participantTags.length > 0 && (
                      <View style={styles.participantTagsRow}>
                        {participantTags.map((tag) => (
                          <View key={tag} style={styles.participantTagPill}>
                            <Text style={styles.participantTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Bio / Description */}
                    {participantBio && (
                      <Text style={styles.participantBioText}>
                        {participantBio}
                      </Text>
                    )}

                    {/* Interests */}
                    {participantInterests.length > 0 && (
                      <View style={styles.participantSection}>
                        <Text style={styles.participantSectionTitle}>
                          Interests
                        </Text>
                        <View style={styles.participantInterestsRow}>
                          {participantInterests.map((interest) => (
                            <View
                              key={interest}
                              style={styles.participantInterestPill}
                            >
                              <Text style={styles.participantInterestText}>
                                {interest}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Social Links - LinkedIn as Pill */}
                    {participantSocialLabel && participantLinkedInUrl && (
                      <View style={styles.participantSection}>
                        <Text style={styles.participantSectionTitle}>
                          Social Links
                        </Text>
                        <View style={styles.participantInterestsRow}>
                          <Pressable
                            style={[styles.participantInterestPill, { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 200 }]}
                            onPress={async () => {
                              try {
                                const url = participantLinkedInUrl;
                                // Ensure URL has protocol
                                const formattedUrl = url.startsWith("http://") || url.startsWith("https://")
                                  ? url
                                  : `https://${url}`;
                                
                                // Try to open URL directly
                                const supported = await Linking.canOpenURL(formattedUrl);
                                if (supported) {
                                  await Linking.openURL(formattedUrl);
                                } else {
                                  // Still try to open - might work even if canOpenURL returns false
                                  try {
                                    await Linking.openURL(formattedUrl);
                                  } catch (openError) {
                                    Alert.alert(
                                      "Cannot Open LinkedIn",
                                      "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
                                      [{ text: "OK" }]
                                    );
                                  }
                                }
                              } catch (error) {
                                if (__DEV__) {
                                  console.error("Error opening LinkedIn URL:", error);
                                }
                                Alert.alert("Error", "Failed to open LinkedIn profile");
                              }
                            }}
                          >
                            <LinkedInIcon size={14} color="#0A66C2" />
                            <Text 
                              style={styles.participantInterestText}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {participantSocialLabel}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </SafeAreaView>
            </Animated.View>
          </View>
        )}

        {/* Meeting Accepted Modal */}
        <MeetingAcceptedModal
          visible={showAcceptedModal}
          onClose={() => {
            setShowAcceptedModal(false);
            onAccept?.();
          }}
          title={title}
          date={date}
          startTime={startTime}
          endTime={endTime}
          location={location}
          meetingType={meetingType}
          meetingLink={meetingLink}
          participantName={participantName}
          participantRole={participantRole}
          participantCompany={participantCompany}
        />

        {/* Meeting Decline Modal */}
        <MeetingDeclineModal
          visible={showDeclineModal}
          onClose={() => {
            setShowDeclineModal(false);
          }}
          onSend={(reason) => {
            setShowDeclineModal(false);
            // Store the reason to pass it when user confirms
            setDeclineReason(reason);
            // Show confirmation modal after decline reason is sent
            // Don't call onDecline yet - wait until user dismisses confirmation
            setShowDeclinedModal(true);
          }}
        />

        {/* Meeting Declined Confirmation Modal */}
        <MeetingCancelledModal
          visible={showDeclinedModal}
          onClose={() => {
            setShowDeclinedModal(false);
            // Close the inbound meeting modal and call onDecline after user sees confirmation
            onDecline?.(declineReason);
            // Clear stored reason
            setDeclineReason(undefined);
          }}
          modalTitle="Meeting Declined"
          meetingTitle={title}
          participantName={participantName}
          participantCompany={participantCompany}
          date={date}
          startTime={startTime}
          endTime={endTime}
          location={location}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: "hidden",
    flexShrink: 1,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF8C42",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FF8C42",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    lineHeight: 32,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#404040",
    marginLeft: 8,
  },
  linkWrap: {
    flex: 1,
    marginLeft: 8,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#D1D5DB", // more visible neutral gray border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 }, // deeper shadow at base
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 6,
  },
  participantCardPressed: {
    opacity: 0.7,
    backgroundColor: "#F9FAFB",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  participantRole: {
    fontSize: 14,
    fontWeight: "400",
    color: "#404040",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#404040",
    lineHeight: 24,
  },
  approvalMessage: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  approvalText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#D97706",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  declineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
  },
  declineButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  // Participant Detail Overlay Styles
  participantOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  participantBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  participantSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  participantSafeArea: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  participantSheetContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  participantHandleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  participantHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
  },
  participantContent: {
    flex: 1,
  },
  participantContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  participantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  participantAvatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  participantHeaderTextContainer: {
    flex: 1,
  },
  participantNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  participantRoleText: {
    fontSize: 14,
    color: "#6B7280",
  },
  participantTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  participantTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  participantTagText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  participantBioText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  participantSection: {
    marginTop: 24,
  },
  participantSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  participantInterestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  participantInterestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  participantInterestText: {
    fontSize: 12,
    color: "#111827",
    flexShrink: 1,
  },
  participantSocialButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
  },
  participantSocialButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
});
