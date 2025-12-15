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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ClockIcon } from "./BottomNavIcons";
import { LocationPinIcon, PersonProfileIcon, ChevronRightIcon } from "./icons";
import { LinkedInIcon } from "./SocialIcons";
import MeetingCancelModal from "./MeetingCancelModal";
import MeetingCancelledModal from "./MeetingCancelledModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.9; // Maximum height to prevent overflow

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

export interface OutboundMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  participantName: string;
  participantRole: string;
  participantCompany: string;
  description?: string;
  expiresIn?: number; // hours
  onParticipantPress?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  // Participant detail props
  showParticipantDetail?: boolean;
  participantTags?: string[];
  participantBio?: string;
  participantInterests?: string[];
  participantSocialLabel?: string;
  onCloseParticipantDetail?: () => void;
}

export default function OutboundMeetingModal({
  visible,
  onClose,
  title,
  date,
  startTime,
  endTime,
  location,
  participantName,
  participantRole,
  participantCompany,
  description,
  expiresIn,
  onParticipantPress,
  onEdit,
  onCancel,
  showParticipantDetail = false,
  participantTags = [],
  participantBio,
  participantInterests = [],
  participantSocialLabel,
  onCloseParticipantDetail,
}: OutboundMeetingModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalHeight = useRef(SCREEN_HEIGHT);
  const hasMeasured = useRef(false);

  // State for edit/cancel modals
  // const [showEditModal, setShowEditModal] = useState(false); // TODO: Re-implement tomorrow
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      modalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      hasMeasured.current = true;

      // If modal is visible and we just measured, ensure it animates in
      if (visible) {
        // Only animate if we haven't started animating yet
        translateY.setValue(modalHeight.current);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    }
  };

  useEffect(() => {
    if (visible) {
      // Use measured height if available, otherwise use screen height
      const initialHeight = hasMeasured.current
        ? modalHeight.current
        : SCREEN_HEIGHT;
      translateY.setValue(initialHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      hasMeasured.current = false;
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentValue = (translateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: modalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  // Participant modal drag-to-close
  const participantTranslateY = useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const participantModalHeight = useRef(SCREEN_HEIGHT);
  const participantHasMeasured = useRef(false);

  // Participant modal layout handler
  const handleParticipantLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      participantModalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      participantHasMeasured.current = true;

      if (showParticipantDetail) {
        participantTranslateY.setValue(participantModalHeight.current);
        Animated.spring(participantTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    }
  };

  // Participant modal visibility effect
  useEffect(() => {
    if (showParticipantDetail) {
      const initialHeight = participantHasMeasured.current
        ? participantModalHeight.current
        : SCREEN_HEIGHT;
      participantTranslateY.setValue(initialHeight);
      Animated.spring(participantTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      participantTranslateY.setValue(SCREEN_HEIGHT);
    }
  }, [showParticipantDetail]);

  // Participant modal PanResponder
  const participantPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        participantTranslateY.setOffset(
          (participantTranslateY as any)._value || 0
        );
        participantTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          participantTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        participantTranslateY.flattenOffset();
        const currentValue = (participantTranslateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(participantTranslateY, {
            toValue: participantModalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            participantTranslateY.setValue(0);
            onCloseParticipantDetail?.();
          });
        } else {
          Animated.spring(participantTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
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

            {/* Location */}
            <View style={styles.infoRow}>
              <LocationPinIcon size={18} color="#404040" />
              <Text style={styles.infoText}>{location}</Text>
            </View>

            {/* Participant Card */}
            <TouchableOpacity
              style={styles.participantCard}
              activeOpacity={0.7}
              onPress={() => {
                onParticipantPress?.();
              }}
            >
              <View style={styles.avatarContainer}>
                <PersonProfileIcon size={24} color="#404040" />
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participantName}</Text>
                <Text style={styles.participantRole}>
                  {participantRole} • {participantCompany}
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
                  Waiting for their approval. Expires in {expiresIn} hours.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <SafeAreaView edges={["bottom"]} style={styles.actionsContainer}>
            {/* Edit Meeting Button */}
            <Pressable
              style={styles.editButton}
              onPress={() => {
                // setShowEditModal(true); // TODO: Re-implement tomorrow
                onEdit?.();
              }}
            >
              <PencilIcon size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Meeting</Text>
            </Pressable>

            {/* Cancel Meeting Button */}
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setShowCancelModal(true);
              }}
            >
              <XCircleIcon size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel Meeting</Text>
            </Pressable>
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
                        <PersonProfileIcon size={28} color="#111827" />
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

                    {/* Social Links */}
                    {participantSocialLabel && (
                      <View style={styles.participantSection}>
                        <Text style={styles.participantSectionTitle}>
                          Social Links
                        </Text>
                        <Pressable style={styles.participantSocialButton}>
                          <LinkedInIcon size={18} color="#0A66C2" />
                          <Text style={styles.participantSocialButtonText}>
                            {participantSocialLabel}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </SafeAreaView>
            </Animated.View>
          </View>
        )}

        {/* Edit Meeting Modal - TODO: Re-implement tomorrow */}

        {/* Cancel Meeting Input Modal */}
        <MeetingCancelModal
          visible={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
          }}
          onSend={(reason: string) => {
            setShowCancelModal(false);
            setShowCancelledModal(true);
            // TODO: Send cancellation reason to backend
            console.log("Cancel reason:", reason);
          }}
        />

        {/* Meeting Cancelled Confirmation Modal */}
        <MeetingCancelledModal
          visible={showCancelledModal}
          onClose={() => {
            setShowCancelledModal(false);
            onCancel?.();
          }}
          title={title}
          date={date}
          startTime={startTime}
          endTime={endTime}
          location={location}
          participantName={participantName}
          participantRole={participantRole}
          participantCompany={participantCompany}
        />
      </View>
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
    maxHeight: MAX_MODAL_HEIGHT,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
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
    color: "#111827",
    marginBottom: 16,
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
    flex: 1,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
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
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  participantRole: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  approvalMessage: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  approvalText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#D97706",
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
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
    width: "100%",
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
