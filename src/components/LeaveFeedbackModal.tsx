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
  const [error, setError] = useState<string | undefined>(undefined);
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
      if (Platform.OS === "ios") {
        // iOS: Animate modal in with translateY
        translateY.setValue(modalHeight.current || SCREEN_HEIGHT);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
      // Android: Modal is always visible when visible=true, no animation needed
    } else {
      if (Platform.OS === "ios") {
        translateY.setValue(SCREEN_HEIGHT);
        keyboardOffset.setValue(0);
      }
      setFeedback("");
      setError(undefined);
      setKeyboardHeight(0);
      Keyboard.dismiss();
    }
  }, [visible, translateY, keyboardOffset]);

  // Keyboard event listeners
  useEffect(() => {
    if (!visible) return;

    if (Platform.OS === "android") {
      // Android: Use keyboardDidShow/DidHide and set keyboardHeight state
      // The modal uses bottom = keyboardHeight to position itself
      // NO animations, NO setTimeout - just set the state directly
      const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
        const kbHeight = e.endCoordinates.height;
        setKeyboardHeight(kbHeight);
        // Input is already focused, no need to re-focus or scroll
      });

      const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardHeight(0);
      });

      return () => {
        keyboardDidShow.remove();
        keyboardDidHide.remove();
      };
    } else {
      // iOS: Use existing translateY approach
      const keyboardWillShow = Keyboard.addListener("keyboardWillShow", (e) => {
        const kbHeight = e.endCoordinates.height;
        setKeyboardHeight(kbHeight);

        Animated.timing(keyboardOffset, {
          toValue: -kbHeight,
          duration: e.duration || 250,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          inputRef.current?.focus();
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, (e.duration || 250) + 50);
      });

      const keyboardWillHide = Keyboard.addListener("keyboardWillHide", (e) => {
        setKeyboardHeight(0);

        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: true,
        }).start();
      });

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }
  }, [visible, keyboardOffset]);

  // Combine translateY and keyboardOffset for iOS only
  const combinedTranslateY = Animated.add(translateY, keyboardOffset);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS === "ios",
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Platform.OS === "ios" &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (Platform.OS === "ios") {
          Keyboard.dismiss();
          translateY.setOffset((translateY as any)._value || 0);
          translateY.setValue(0);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (Platform.OS === "ios" && gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Platform.OS === "ios") {
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
        }
      },
    })
  ).current;

  const validateFeedback = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Feedback is required";
    }
    if (trimmed.length < 10) {
      return "Feedback must be at least 10 characters";
    }
    if (trimmed.length > MAX_CHARACTERS) {
      return `Feedback must be less than ${MAX_CHARACTERS} characters`;
    }
    return undefined;
  };

  const handleSend = () => {
    const validationError = validateFeedback(feedback);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    Keyboard.dismiss();
    onSubmit?.(feedback.trim());
    setFeedback("");
  };

  const characterCount = feedback.length;
  const isSendDisabled = feedback.trim().length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        {Platform.OS === "android" ? (
          <View
            style={[
              styles.bottomSheet,
              {
                bottom: keyboardHeight,
                maxHeight: SCREEN_HEIGHT * 0.9,
              },
            ]}
            onLayout={handleLayout}
          >
            <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.title}>
                  Leave a feedback about the session
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
                      style={[
                        styles.textInput,
                        error && { borderColor: "#EF4444" },
                      ]}
                      placeholder="Say something about this session."
                      placeholderTextColor="#A3A3A3"
                      multiline
                      value={feedback}
                      onChangeText={(text) => {
                        if (text.length <= MAX_CHARACTERS) {
                          setFeedback(text);
                          // Clear error when user starts typing
                          if (error) {
                            setError(undefined);
                          }
                        }
                      }}
                      textAlignVertical="top"
                      returnKeyType="done"
                      blurOnSubmit={false}
                    />
                    {/* Character Counter */}
                    <View style={styles.counterContainer}>
                      <Text
                        style={[
                          styles.counterText,
                          characterCount > MAX_CHARACTERS && {
                            color: "#EF4444",
                          },
                        ]}
                      >
                        {characterCount}/{MAX_CHARACTERS}
                      </Text>
                      <PenIcon size={14} color="#A3A3A3" />
                    </View>
                  </View>
                  {error && <Text style={styles.errorText}>{error}</Text>}
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
          </View>
        ) : (
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
              <View
                style={styles.handleContainer}
                {...panResponder.panHandlers}
              >
                <View style={styles.handle} />
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.title}>
                  Leave a feedback about the session
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
                      style={[
                        styles.textInput,
                        error && { borderColor: "#EF4444" },
                      ]}
                      placeholder="Say something about this session."
                      placeholderTextColor="#A3A3A3"
                      multiline
                      value={feedback}
                      onChangeText={(text) => {
                        if (text.length <= MAX_CHARACTERS) {
                          setFeedback(text);
                          // Clear error when user starts typing
                          if (error) {
                            setError(undefined);
                          }
                        }
                      }}
                      textAlignVertical="top"
                      returnKeyType="done"
                      blurOnSubmit={false}
                    />
                    {/* Character Counter */}
                    <View style={styles.counterContainer}>
                      <Text
                        style={[
                          styles.counterText,
                          characterCount > MAX_CHARACTERS && {
                            color: "#EF4444",
                          },
                        ]}
                      >
                        {characterCount}/{MAX_CHARACTERS}
                      </Text>
                      <PenIcon size={14} color="#A3A3A3" />
                    </View>
                  </View>
                  {error && <Text style={styles.errorText}>{error}</Text>}
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
        )}
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
    paddingTop: 12,
    paddingBottom: 8,
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
    color: "#000000",
    paddingHorizontal: 24,
    paddingTop: 8,
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
    marginHorizontal: 24,
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
    fontSize: 16,
    color: "#000000",
    paddingBottom: 40,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  counterContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 2,
  },
  counterText: {
    fontSize: 12,
    color: "#A3A3A3",
    fontWeight: "400",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 24,
    marginRight: 24,
  },
  buttonContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    zIndex: 3,
  },
  actionButton: {
    backgroundColor: "#000000",
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
    color: "#A3A3A3",
  },
});
