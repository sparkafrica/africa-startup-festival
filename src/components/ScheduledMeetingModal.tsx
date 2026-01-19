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
import {
  LocationPinIcon,
  PersonProfileIcon,
  ChevronRightIcon,
  SpeechBubbleIcon,
} from "./icons";
import { VideoIcon } from "./MenuIcons";
import { LinkedInIcon } from "./SocialIcons";
import LeaveFeedbackModal from "./LeaveFeedbackModal";
import MeetingCancelModal from "./MeetingCancelModal";
import MeetingCancelledModal from "./MeetingCancelledModal";
import FeedbackSentModal from "./FeedbackSentModal";
import EditMeetingModal from "./EditMeetingModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

interface PencilIconProps {
  size?: number;
  color?: string;
}

function PencilIcon({ size = 20, color = "#FFFFFF" }: PencilIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z"
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

function XCircleIcon({ size = 20, color = "#FFFFFF" }: XCircleIconProps) {
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

export interface ScheduledMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  meetingType: "physical" | "virtual";
  participantName: string;
  participantRole: string;
  participantCompany: string;
  description?: string;
  onParticipantPress?: () => void;
  onEdit?: (data: {
    title: string;
    meetingType: "physical" | "virtual";
    tableNumber?: string;
    meetingLink?: string;
    time: string;
    date: string;
    description: string;
  }) => void;
  onCancel?: () => void;
  onLeaveFeedback?: () => void;
  isOutbound?: boolean; // If true, shows Edit Meeting button
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

export default function ScheduledMeetingModal({
  visible,
  onClose,
  title,
  date,
  startTime,
  endTime,
  location,
  meetingLink,
  meetingType,
  participantName,
  participantRole,
  participantCompany,
  description,
  onParticipantPress,
  onEdit,
  onCancel,
  onLeaveFeedback,
  isOutbound = false,
  showParticipantDetail = false,
  participantTags = [],
  participantBio,
  participantInterests = [],
  participantSocialLabel,
  participantLinkedInUrl,
  participantAvatar,
  onCloseParticipantDetail,
}: ScheduledMeetingModalProps) {
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackSentModal, setShowFeedbackSentModal] = useState(false);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !hasMeasured.current) {
      modalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      hasMeasured.current = true;
    }
  };

  useEffect(() => {
    if (visible) {
      // Close participant modal when meeting modal opens
      if (showParticipantDetail) {
        onCloseParticipantDetail?.();
      }

      translateY.stopAnimation();
      isAnimating.current = false;

      const initialHeight = hasMeasured.current
        ? modalHeight.current
        : SCREEN_HEIGHT;
      translateY.setValue(initialHeight);

      isAnimating.current = true;

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        isAnimating.current = false;
      });
    } else {
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
      participantTranslateY.stopAnimation();
      participantIsAnimating.current = false;

      const initialHeight = participantHasMeasured.current
        ? participantModalHeight.current
        : SCREEN_HEIGHT;
      participantTranslateY.setValue(initialHeight);

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
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
          onLayout={handleLayout}
        >
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
              <Text style={styles.statusText}>Scheduled</Text>
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

            {/* Meeting Type */}
            <View style={styles.infoRow}>
              <VideoIcon size={18} color="#404040" />
              <Text style={styles.infoText}>
                {meetingType === "virtual"
                  ? "Virtual Meeting"
                  : "Physical Meeting"}
              </Text>
            </View>

            {/* Meeting Link (for virtual meetings) - positioned directly below meeting type */}
            {meetingType === "virtual" && meetingLink && (
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>{meetingLink}</Text>
              </View>
            )}

            {/* Location (for physical meetings) */}
            {meetingType === "physical" && location && (
              <View style={styles.infoRow}>
                <LocationPinIcon size={18} color="#404040" />
                <Text style={styles.infoText}>{location}</Text>
              </View>
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
                  <PersonProfileIcon size={24} color="#000000" />
                )}
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participantName}</Text>
                <Text style={styles.participantRole}>
                  {participantRole} • {participantCompany}
                </Text>
              </View>
              <ChevronRightIcon size={20} color="#000000" />
            </TouchableOpacity>

            {/* Description Section */}
            {description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Edit Meeting Button (only for outbound) */}
              {isOutbound && (
                <Pressable
                  style={styles.editButton}
                  onPress={() => setShowEditModal(true)}
                >
                  <PencilIcon size={20} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>Edit Meeting</Text>
                </Pressable>
              )}

              {/* Cancel Meeting Button */}
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowCancelModal(true)}
              >
                <XCircleIcon size={20} color="#FFFFFF" />
                <Text style={styles.cancelButtonText}>Cancel Meeting</Text>
              </Pressable>

              {/* Leave Feedback Button */}
              <Pressable
                style={styles.feedbackButton}
                onPress={() => setShowFeedbackModal(true)}
              >
                <SpeechBubbleIcon size={20} color="#000000" />
                <Text style={styles.feedbackButtonText}>Leave Feedback</Text>
              </Pressable>
            </View>
          </ScrollView>

          <SafeAreaView edges={["bottom"]} style={styles.safeArea} />
        </Animated.View>
      </View>

      {/* Edit Meeting Modal */}
      {isOutbound && (
        <EditMeetingModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => {
            setShowEditModal(false);
            onEdit?.(data);
          }}
          initialData={{
            title,
            meetingType,
            tableNumber:
              meetingType === "physical" && location
                ? location.startsWith("Table ")
                  ? location
                  : `Table ${location}`
                : undefined,
            meetingLink: meetingType === "virtual" ? meetingLink : undefined,
            time: `${startTime} - ${endTime}`,
            date,
            description: description || "",
          }}
        />
      )}

      {/* Cancel Meeting Modal */}
      <MeetingCancelModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSend={(reason) => {
          setShowCancelModal(false);
          // Show confirmation modal after cancellation reason is sent
          // Don't call onCancel yet - wait until user dismisses confirmation
          setShowCancelledModal(true);
        }}
      />

      {/* Meeting Cancelled Confirmation Modal */}
      <MeetingCancelledModal
        visible={showCancelledModal}
        onClose={() => {
          setShowCancelledModal(false);
          // Close the scheduled meeting modal and call onCancel after user sees confirmation
          onCancel?.();
        }}
        meetingTitle={title}
        participantName={participantName}
        participantCompany={participantCompany}
        date={date}
        startTime={startTime}
        endTime={endTime}
        location={location}
        onViewCancelled={() => {
          // TODO: Navigate to cancelled meetings view
          setShowCancelledModal(false);
          // Close the scheduled meeting modal and call onCancel
          onCancel?.();
        }}
      />

      {/* Leave Feedback Modal */}
      <LeaveFeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={async (feedback) => {
          try {
            // Call the feedback handler from parent (MeetingsScreen)
            // This will handle API submission when backend endpoint is ready
            await onLeaveFeedback?.();
            // Close feedback input modal and show success confirmation
            setShowFeedbackModal(false);
            setShowFeedbackSentModal(true);
          } catch (error) {
            // Error handling is done in parent component
            // Just close the modal on error
            setShowFeedbackModal(false);
          }
        }}
        eventTitle={title}
      />

      {/* Feedback Sent Confirmation Modal */}
      <FeedbackSentModal
        visible={showFeedbackSentModal}
        onClose={() => {
          setShowFeedbackSentModal(false);
        }}
        meetingTitle={title}
      />

      {/* Participant Detail Overlay - Renders inside the same Modal */}
      {visible && showParticipantDetail && (
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
            <SafeAreaView edges={["bottom"]} style={styles.participantSafeArea}>
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
                        <PersonProfileIcon size={28} color="#000000" />
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

                  {/* Profile Tags */}
                  {participantTags.length > 0 && (
                    <View style={styles.participantTagsRow}>
                      {participantTags.map((tag, index) => {
                        // First tag gets light blue border, second gets light green border
                        const borderColor = index === 0 ? "#7DD3FC" : "#86EFAC"; // sky-300 and emerald-300
                        return (
                          <View
                            key={tag}
                            style={[styles.participantTagPill, { borderColor }]}
                          >
                            <Text style={styles.participantTagText}>{tag}</Text>
                          </View>
                        );
                      })}
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
                          style={[styles.participantInterestPill, { flexDirection: "row", alignItems: "center", gap: 6 }]}
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
                          <Text style={styles.participantInterestText}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
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
    zIndex: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: MAX_MODAL_HEIGHT,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#DFF1E4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#404040",
    marginLeft: 8,
  },
  linkContainer: {
    marginLeft: 26,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  participantRole: {
    fontSize: 14,
    color: "#404040",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#404040",
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#000000",
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FF3B30",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  participantSheetContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  participantHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  participantHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#000000",
    marginBottom: 4,
  },
  participantRoleText: {
    fontSize: 14,
    color: "#404040",
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
    backgroundColor: "#FFFFFF",
  },
  participantTagText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
  },
  participantBioText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#404040",
  },
  participantSection: {
    marginTop: 24,
  },
  participantSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
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
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  participantInterestText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
  },
  participantSocialButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 12,
  },
  participantSocialButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
});
