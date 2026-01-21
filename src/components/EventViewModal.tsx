import React, { useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClockIcon } from "./BottomNavIcons";
import { LocationPinIcon, SpeechBubbleIcon, PersonProfileIcon } from "./icons";
import { CalendarIconWhite } from "./SocialIcons";
import { ChevronRightIcon } from "./icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

export interface Speaker {
  id: string;
  name: string;
  affiliation: string;
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
  sponsoredBy?: {
    name: string;
    color: "blue" | "purple";
  };
  speakers?: Speaker[];
  description?: string;
  onAskQuestion?: () => void;
  onLeaveFeedback?: () => void;
}

export default function EventViewModal({
  visible,
  onClose,
  title,
  startTime,
  endTime,
  stage,
  sponsoredBy,
  speakers = [],
  description,
  onAskQuestion,
  onLeaveFeedback,
}: EventViewModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    if (visible) {
      isAnimating.current = true;
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        isAnimating.current = false;
      });
    } else {
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

  const sponsorColors = {
    blue: {
      bg: "#DBEAFE",
      dot: "#1D4ED8",
      text: "#1D4ED8",
    },
    purple: {
      bg: "#F3E8FF",
      dot: "#7C3AED",
      text: "#7C3AED",
    },
  };

  const sponsorColor = sponsoredBy ? sponsorColors[sponsoredBy.color] : null;

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
            scrollEnabled={true}
          >
            {/* Sponsored Tag */}
            {sponsoredBy && sponsorColor && (
              <View
                style={[
                  styles.sponsoredTag,
                  { backgroundColor: sponsorColor.bg },
                ]}
              >
                <View
                  style={[
                    styles.sponsoredDot,
                    { backgroundColor: sponsorColor.dot },
                  ]}
                />
                <Text
                  style={[styles.sponsoredText, { color: sponsorColor.text }]}
                >
                  Sponsored by {sponsoredBy.name}
                </Text>
              </View>
            )}

            {/* Event Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Time and Location */}
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
                      <PersonProfileIcon size={24} color="#000000" />
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
          <SafeAreaView edges={["bottom"]} style={styles.actionsContainer}>
            <Pressable style={styles.addButton} onPress={onAskQuestion}>
              <CalendarIconWhite size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ask a question</Text>
            </Pressable>
            <Pressable style={styles.feedbackButton} onPress={onLeaveFeedback}>
              <SpeechBubbleIcon size={20} color="#000000" />
              <Text style={styles.feedbackButtonText}>Leave Feedback</Text>
            </Pressable>
          </SafeAreaView>
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
  sponsoredTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  sponsoredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sponsoredText: {
    fontSize: 12,
    fontWeight: "500",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  },
  addButtonText: {
    color: "#FFFFFF",
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
