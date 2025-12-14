import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_CHARACTERS = 200;

interface LeaveFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (feedback: string) => void;
  eventTitle?: string;
}

function PenIcon({
  size = 16,
  color = "#A3A3A3",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function LeaveFeedbackModal({
  visible,
  onClose,
  onSubmit,
  eventTitle,
}: LeaveFeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Reset keyboard offset when modal opens
      keyboardOffset.setValue(0);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      keyboardOffset.setValue(0); // Reset keyboard offset when modal closes
      setFeedback("");
      setKeyboardHeight(0);
    }
  }, [visible, translateY, keyboardOffset]);

  // Handle keyboard show/hide
  useEffect(() => {
    if (!visible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        // Animate modal up when keyboard appears
        // Move modal up by keyboard height minus safe area to keep content visible
        Animated.timing(keyboardOffset, {
          toValue: -height + 40, // Raise modal above keyboard with padding for navigation bar
          duration: 250,
          useNativeDriver: true,
        }).start();
        // Scroll to input when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        // Animate modal back down when keyboard hides
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      // Reset keyboard offset when listeners are removed (modal closes)
      keyboardOffset.setValue(0);
    };
  }, [visible, keyboardOffset]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SCREEN_HEIGHT);
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

  const handleSend = () => {
    if (feedback.trim()) {
      onSubmit?.(feedback);
      setFeedback("");
      onClose();
    }
  };

  const characterCount = feedback.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={styles.modalContainer}
      >
        {/* Semi-transparent Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                {
                  translateY: Animated.add(translateY, keyboardOffset),
                },
              ],
              maxHeight:
                keyboardHeight > 0
                  ? SCREEN_HEIGHT * 0.85 - keyboardHeight
                  : SCREEN_HEIGHT * 0.7,
            },
          ]}
        >
          {/* Draggable Handle */}
          <View style={styles.draggableArea} {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>Leave a feedback about the session</Text>

            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder="Say something about this session."
                placeholderTextColor="#A3A3A3"
                multiline
                value={feedback}
                onChangeText={setFeedback}
                maxLength={MAX_CHARACTERS}
                textAlignVertical="top"
                onFocus={() => {
                  // Scroll to ensure input is visible when keyboard appears
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
              {/* Character Counter */}
              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                  {characterCount}/{MAX_CHARACTERS}
                </Text>
                <PenIcon size={14} color="#A3A3A3" />
              </View>
            </View>

            {/* Send Button */}
            <Pressable
              style={[
                styles.sendButton,
                !feedback.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!feedback.trim()}
            >
              <Text
                style={[
                  styles.sendButtonText,
                  !feedback.trim() && styles.sendButtonTextDisabled,
                ]}
              >
                Send
              </Text>
            </Pressable>
          </ScrollView>

          <SafeAreaView edges={["bottom"]} style={styles.safeArea} />
        </Animated.View>
      </KeyboardAvoidingView>
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
    maxHeight: SCREEN_HEIGHT * 0.7,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 24,
  },
  textInput: {
    minHeight: 120,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    fontSize: 16,
    color: "#000000",
    textAlignVertical: "top",
  },
  counterContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  counterText: {
    fontSize: 12,
    color: "#A3A3A3",
    fontWeight: "400",
  },
  sendButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#A3A3A3",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
  },
});
