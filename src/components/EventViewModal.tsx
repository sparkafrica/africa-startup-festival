import React, { useRef, useLayoutEffect } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClockIcon } from "./BottomNavIcons";
import { LocationPinIcon, SpeechBubbleIcon, PersonProfileIcon } from "./icons";
import { CalendarIconWhite } from "./SocialIcons";
import { ChevronRightIcon } from "./icons";
import LoadingSpinner from "./LoadingSpinner";
import ScheduleBadge from "./ScheduleBadge";
import type { ScheduleBadgeColor } from "../utils/scheduleMetadata";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

export interface Speaker {
  id: string;
  name: string;
  affiliation: string;
  profilePic?: string | null;
  bio?: string;
  interests?: string[];
  tags?: string[];
  socialLabel?: string;
  onPress?: () => void;
}

export interface EventViewModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  startTime: string;
  endTime: string;
  stage: string;
  sessionBadge?: {
    label: string;
    color?: ScheduleBadgeColor;
  };
  sponsoredBy?: {
    name: string;
    color?: ScheduleBadgeColor;
  };
  speakers?: Speaker[];
  description?: string;
  /** AMA / Slido — detail sheet only; opens app.sli.do in browser */
  slidoUrl?: string;
  onOpenSlido?: () => void;
  onAddToSchedule?: () => void;
  onLeaveFeedback?: () => void;
  onRemoveFromSchedule?: () => void; // For My Schedule tab
  isInMySchedule?: boolean;
  isAddingToSchedule?: boolean;
}

export default function EventViewModal({
  visible,
  onClose,
  title,
  startTime,
  endTime,
  stage,
  sessionBadge,
  sponsoredBy,
  speakers = [],
  description,
  slidoUrl,
  onOpenSlido,
  onAddToSchedule,
  onLeaveFeedback,
  onRemoveFromSchedule,
  isInMySchedule,
  isAddingToSchedule = false,
}: EventViewModalProps) {
  const showActions =
    !!onRemoveFromSchedule ||
    !!onAddToSchedule ||
    !!onLeaveFeedback ||
    !!isInMySchedule;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isAnimating = useRef(false);

  useLayoutEffect(() => {
    if (visible) {
      translateY.stopAnimation();
      translateY.setValue(0);
      isAnimating.current = false;
    } else {
      translateY.stopAnimation();
      translateY.setValue(SCREEN_HEIGHT);
      isAnimating.current = false;
    }
  }, [visible, translateY]);

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
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SCREEN_HEIGHT);
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
        >
          {/* Draggable Handle */}
          <View style={styles.draggableArea} {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={true}
            scrollEnabled={visible}
            removeClippedSubviews
            pointerEvents={visible ? "auto" : "none"}
          >
            {(sessionBadge || sponsoredBy) && (
              <View style={styles.badgeStack}>
                {sessionBadge ? (
                  <ScheduleBadge
                    text={sessionBadge.label}
                    color={sessionBadge.color}
                    className="mb-0"
                  />
                ) : null}
                {sponsoredBy ? (
                  <ScheduleBadge
                    text={`Sponsored by ${sponsoredBy.name}`}
                    color={sponsoredBy.color}
                    className="mb-0"
                  />
                ) : null}
              </View>
            )}

            {/* Event Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Time, location, optional AMA Q&A link */}
            <View style={styles.timeLocationRow}>
              <View style={styles.timeLocationCol}>
                <View style={styles.infoRow}>
                  <ClockIcon size={18} color="#000000" />
                  <Text style={styles.infoText}>
                    {startTime} - {endTime}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <LocationPinIcon size={18} color="#000000" />
                  <Text style={styles.infoText}>{stage}</Text>
                </View>
              </View>
              {slidoUrl && onOpenSlido ? (
                <Pressable
                  onPress={onOpenSlido}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.slidoBox,
                    pressed && styles.slidoBoxPressed,
                  ]}
                >
                  <Text style={styles.slidoLinkText}>Q&A</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Speakers Section */}
            {speakers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Speakers</Text>
                {speakers.map((speaker) => (
                  <Pressable
                    key={speaker.id}
                    style={({ pressed }) => [
                      styles.speakerCard,
                      pressed && styles.speakerCardPressed,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (speaker?.onPress) {
                        speaker.onPress();
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.speakerIconContainer}>
                      {speaker.profilePic ? (
                        <Image
                          source={{ uri: speaker.profilePic }}
                          style={styles.speakerAvatar}
                        />
                      ) : (
                        <PersonProfileIcon size={24} color="#000000" />
                      )}
                    </View>
                    <View style={styles.speakerInfo}>
                      <Text style={styles.speakerName}>{speaker.name}</Text>
                      <Text style={styles.speakerAffiliation}>
                        {speaker.affiliation}
                      </Text>
                    </View>
                    <ChevronRightIcon size={20} color="#000000" />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Description Section */}
            {description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {showActions ? (
          <SafeAreaView
            edges={["bottom"]}
            style={styles.actionsContainer}
            pointerEvents={visible ? "auto" : "none"}
          >
            {onRemoveFromSchedule ? (
              <Pressable style={styles.removeButton} onPress={onRemoveFromSchedule}>
                <Text style={styles.removeButtonText}>Remove from schedule</Text>
              </Pressable>
            ) : isInMySchedule ? (
              <View style={styles.addedButton}>
                <CalendarIconWhite size={20} color="#737373" />
                <Text style={styles.addedButtonText}>Added</Text>
              </View>
            ) : onAddToSchedule ? (
              <Pressable
                style={[
                  styles.addButton,
                  isAddingToSchedule && styles.addButtonLoading,
                ]}
                onPress={onAddToSchedule}
                disabled={isAddingToSchedule}
              >
                {isAddingToSchedule ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <CalendarIconWhite size={20} color="#FFFFFF" />
                )}
                <Text style={styles.addButtonText}>
                  {isAddingToSchedule ? "Adding…" : "Add to schedule"}
                </Text>
              </Pressable>
            ) : null}
            {onLeaveFeedback ? (
            <Pressable style={styles.feedbackButton} onPress={onLeaveFeedback}>
              <SpeechBubbleIcon size={20} color="#000000" />
              <Text style={styles.feedbackButtonText}>Leave a Feedback</Text>
            </Pressable>
            ) : null}
          </SafeAreaView>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
    elevation: 1001,
  },
  draggableArea: {
    width: "100%",
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  badgeStack: {
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    lineHeight: 32,
  },
  timeLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  timeLocationCol: {
    flex: 1,
    paddingRight: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  slidoBox: {
    backgroundColor: "#E8F8F0",
    borderWidth: 1,
    borderColor: "#1BB273",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slidoBoxPressed: {
    opacity: 0.88,
  },
  slidoLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1BB273",
  },
  infoText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 8,
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
  speakerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  speakerCardPressed: {
    backgroundColor: "#E5E5E5",
    opacity: 0.8,
  },
  speakerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  speakerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 4,
  },
  speakerAffiliation: {
    fontSize: 14,
    fontWeight: "400",
    color: "#525252",
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    lineHeight: 24,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 8,
  },
  addButtonLoading: {
    backgroundColor: "#404040",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  removeButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  addedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  addedButtonText: {
    color: "#737373",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
  },
  feedbackButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});
