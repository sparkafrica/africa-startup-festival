import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_CHARACTERS = 200;

interface MeetingCancelModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (reason: string) => void;
}

export default function MeetingCancelModal({
  visible,
  onClose,
  onSend,
}: MeetingCancelModalProps) {
  const [reason, setReason] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const modalHeight = useRef(SCREEN_HEIGHT);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      modalHeight.current = height;
    }
  };

  // Modal visibility effect
  useEffect(() => {
    if (visible) {
      translateY.setValue(modalHeight.current || SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      keyboardOffset.setValue(0);
      setReason("");
      setKeyboardHeight(0);
      Keyboard.dismiss();
    }
  }, [visible, translateY, keyboardOffset]);

  // Keyboard event listeners
  useEffect(() => {
    if (!visible) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const kbHeight = e.endCoordinates.height;
        setKeyboardHeight(kbHeight);

        // Calculate offset differently for Android vs iOS
        let offset: number;
        if (Platform.OS === "android") {
          // On Android, keyboard height can be unreliable, so use screenY
          // screenY gives us the keyboard top position from screen top
          const keyboardTop = e.endCoordinates.screenY;

          // If screenY is valid and reasonable, use it
          // Otherwise fall back to keyboard height
          if (keyboardTop > 0 && keyboardTop < SCREEN_HEIGHT) {
            // Calculate distance from screen bottom to keyboard top
            const distanceFromBottom = SCREEN_HEIGHT - keyboardTop;
            // Clamp to reasonable values (between 0 and screen height)
            const clampedDistance = Math.max(
              0,
              Math.min(distanceFromBottom, SCREEN_HEIGHT * 0.5)
            );
            offset = -clampedDistance;
          } else {
            // Fallback: use keyboard height, but clamp it
            const clampedHeight = Math.min(kbHeight, SCREEN_HEIGHT * 0.5);
            offset = -clampedHeight;
          }
        } else {
          // iOS: use keyboard height directly (works correctly on iOS)
          offset = -kbHeight;
        }

        // On Android, add a small delay to ensure keyboard is fully rendered
        const animateOffset = () => {
          Animated.timing(keyboardOffset, {
            toValue: offset,
            duration: Platform.OS === "ios" ? e.duration || 250 : 250,
            useNativeDriver: true,
          }).start();
        };

        if (Platform.OS === "android") {
          setTimeout(animateOffset, 100);
        } else {
          animateOffset();
        }

        setTimeout(
          () => {
            inputRef.current?.focus();
            scrollViewRef.current?.scrollToEnd({ animated: true });
          },
          Platform.OS === "ios" ? (e.duration || 250) + 50 : 350
        );
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        setKeyboardHeight(0);

        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === "ios" ? e.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [visible, keyboardOffset]);

  // Combine translateY and keyboardOffset
  const combinedTranslateY = Animated.add(translateY, keyboardOffset);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        Keyboard.dismiss();
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

  const handleSend = () => {
    if (reason.trim().length > 0) {
      Keyboard.dismiss();
      onSend(reason.trim());
      setReason("");
    }
  };

  const characterCount = reason.length;
  const isSendDisabled = reason.trim().length === 0;

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
              transform: [{ translateY: combinedTranslateY }],
              maxHeight: SCREEN_HEIGHT * 0.9,
            },
          ]}
          onLayout={handleLayout}
        >
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            {/* Handle */}
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
              {/* Title */}
              <Text style={styles.title}>
                Tell us why you are cancelling your meeting?
              </Text>

              {/* Scrollable Content */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {/* Text Input Container */}
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    placeholder="Type in your reasons here."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={reason}
                    onChangeText={(text) => {
                      if (text.length <= MAX_CHARACTERS) {
                        setReason(text);
                      }
                    }}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  {/* Character Counter */}
                  <View style={styles.counterContainer}>
                    <Text style={styles.counterText}>
                      {characterCount}/{MAX_CHARACTERS}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Button - Fixed at bottom */}
              <View
                style={[
                  styles.buttonContainer,
                  {
                    paddingBottom: keyboardHeight > 0 ? 8 : 20,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.actionButton,
                    isSendDisabled && styles.actionButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={isSendDisabled}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      isSendDisabled && styles.actionButtonTextDisabled,
                    ]}
                  >
                    Send
                  </Text>
                </Pressable>
              </View>
            </View>
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
  },
  safeArea: {
    flex: 1,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    lineHeight: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    position: "relative",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    maxHeight: 200,
    fontSize: 14,
    color: "#111827",
    paddingBottom: 40,
    lineHeight: 20,
  },
  counterContainer: {
    position: "absolute",
    bottom: 8,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  counterText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  buttonContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    zIndex: 3,
  },
  actionButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  actionButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonTextDisabled: {
    color: "#9CA3AF",
  },
});
