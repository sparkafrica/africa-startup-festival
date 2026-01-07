import React, { useState, useEffect, useRef } from "react";
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "./icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface RequestMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => void;
  attendeeName?: string;
}

export interface MeetingFormData {
  title: string;
  meetingType: "Physical" | "Virtual";
  tableNumber?: string;
  meetingLink?: string;
  date?: string;
  time?: string;
  description: string;
}

export default function RequestMeetingModal({
  visible,
  onClose,
  onSubmit,
  attendeeName,
}: RequestMeetingModalProps) {
  const [meetingType, setMeetingType] = useState<"Physical" | "Virtual">(
    "Physical"
  );
  const [title, setTitle] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    tableNumber?: string;
    meetingLink?: string;
    date?: string;
    time?: string;
    description?: string;
  }>({});

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionFieldRef = useRef<View>(null);
  const descriptionFieldY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags with sufficient movement
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
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

  useEffect(() => {
    if (visible) {
      // Smooth entrance animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      // Reset form when modal opens
      setTitle("");
      setTableNumber("");
      setMeetingLink("");
      setSelectedDate(null);
      setSelectedTime(null);
      setDescription("");
      setShowDatePicker(false);
      setShowTimePicker(false);
      setKeyboardHeight(0);
      setErrors({});
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate Meeting Title
    if (!title.trim()) {
      newErrors.title = "Meeting title is required";
    }

    // Validate Table Number (Physical) or Meeting Link (Virtual)
    if (meetingType === "Physical") {
      if (!tableNumber.trim()) {
        newErrors.tableNumber = "Table number is required";
      }
    } else {
      if (!meetingLink.trim()) {
        newErrors.meetingLink = "Meeting link is required";
      }
    }

    // Validate Date
    if (!selectedDate) {
      newErrors.date = "Date is required";
    }

    // Validate Time
    if (!selectedTime) {
      newErrors.time = "Time is required";
    }

    // Validate Description
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid (for button state)
  const isFormValid = (): boolean => {
    const hasTitle = title.trim().length > 0;
    const hasTableOrLink =
      meetingType === "Physical"
        ? tableNumber.trim().length > 0
        : meetingLink.trim().length > 0;
    const hasDate = selectedDate !== null;
    const hasTime = selectedTime !== null;
    const hasDescription = description.trim().length > 0;

    return hasTitle && hasTableOrLink && hasDate && hasTime && hasDescription;
  };

  const handleSubmit = () => {
    if (validateForm()) {
    const formData: MeetingFormData = {
      title,
      meetingType,
      tableNumber: meetingType === "Physical" ? tableNumber : undefined,
      meetingLink: meetingType === "Virtual" ? meetingLink : undefined,
      date: selectedDate || undefined,
      time: selectedTime || undefined,
      description,
    };
    onSubmit(formData);
    // Reset form
    setTitle("");
    setTableNumber("");
    setMeetingLink("");
    setSelectedDate(null);
    setSelectedTime(null);
    setDescription("");
      setErrors({});
    onClose();
    }
  };

  // Clear error when field is edited
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // TODO: BACKEND INTEGRATION - Fetch available dates from backend
  // API Endpoint: GET /api/meetings/available-dates?attendeeId={attendeeId}
  // Response: { dates: { id: string, label: string, value: string }[] }
  // TODO: BACKEND - Filter by attendee availability
  // TODO: BACKEND - Exclude past dates and dates outside event window
  // Sample dates - in production, these would come from backend
  const availableDates = [
    { id: "1", label: "26th June, 2025", value: "2025-06-26" },
    { id: "2", label: "27th June, 2025", value: "2025-06-27" },
  ];

  // Sample times - in production, these would come from backend
  const availableTimes = [
    { id: "1", label: "10:30 AM - 11:00 AM", value: "10:30-11:00" },
    { id: "2", label: "10:30 AM - 10:50 AM", value: "10:30-10:50" },
    { id: "3", label: "11:00 AM - 11:30 AM", value: "11:00-11:30" },
  ];

  // TODO: BACKEND INTEGRATION - Fetch available tables from backend
  // API Endpoint: GET /api/meetings/available-tables?date={date}&time={time}
  // Response: { tables: { id: string, label: string, value: string }[] }
  // TODO: BACKEND - Only fetch for physical meetings
  // TODO: BACKEND - Filter by date and time slot availability
  // TODO: BACKEND - Real-time validation as user selects date/time
  // Sample tables - in production, these would come from backend
  const availableTables = [
    { id: "1", label: "Table 15", value: "15" },
    { id: "2", label: "Table 20", value: "20" },
    { id: "3", label: "Table 25", value: "25" },
  ];

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
          style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        >
          <View style={styles.draggableArea} {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              contentContainerStyle={[
                styles.contentContainer,
                {
                  paddingBottom: keyboardHeight > 0 ? keyboardHeight + 50 : 20,
                },
              ]}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Title */}
              <Text style={styles.title}>Request a Meeting</Text>

              {/* Information Banner */}
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  There's a 24-hour window for recipients to respond. After
                  that, any unconfirmed slots will be reopened to the public.
                </Text>
              </View>

              {/* Meeting Title */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Meeting Title</Text>
                <View style={[styles.input, errors.title && styles.inputError]}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., Product Discussion"
                    placeholderTextColor="#A3A3A3"
                    value={title}
                    onChangeText={(text) => {
                      setTitle(text);
                      clearError("title");
                    }}
                  />
                </View>
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>

              {/* Meeting Type - SegmentedControl */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Meeting Type</Text>
                <View style={styles.segmentedControl}>
                  <Pressable
                    onPress={() => setMeetingType("Physical")}
                    style={[
                      styles.segment,
                      meetingType === "Physical" && styles.segmentActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        meetingType === "Physical" && styles.segmentTextActive,
                      ]}
                    >
                      Physical
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMeetingType("Virtual")}
                    style={[
                      styles.segment,
                      meetingType === "Virtual" && styles.segmentActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        meetingType === "Virtual" && styles.segmentTextActive,
                      ]}
                    >
                      Virtual
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Date Picker */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Date</Text>
                <Pressable
                  style={[styles.input, errors.date && styles.inputError]}
                  onPress={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowTimePicker(false);
                    setShowTablePicker(false);
                    clearError("date");
                  }}
                >
                  <CalendarIcon size={20} />
                  <Text
                    style={[
                      styles.inputText,
                      { marginLeft: 12 },
                      !selectedDate && styles.placeholderText,
                    ]}
                  >
                    {selectedDate || "Select date"}
                  </Text>
                  {showDatePicker ? (
                    <ChevronUpIcon size={20} color="#A3A3A3" />
                  ) : (
                    <ChevronDownIcon size={20} color="#A3A3A3" />
                  )}
                </Pressable>

                {/* Date Options */}
                {showDatePicker && (
                  <View style={styles.pickerOptions}>
                    {availableDates.map((date) => (
                      <Pressable
                        key={date.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          setSelectedDate(date.label);
                          setShowDatePicker(false);
                          clearError("date");
                        }}
                      >
                        <CalendarIcon size={20} active={true} />
                        <Text style={styles.pickerOptionText}>
                          {date.label}
                        </Text>
                        {selectedDate === date.label && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
                {errors.date && (
                  <Text style={styles.errorText}>{errors.date}</Text>
                )}
              </View>

              {/* Table Number (Physical) or Meeting Link (Virtual) */}
              {meetingType === "Physical" ? (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Table Number</Text>
                  <Pressable
                    style={[
                      styles.input,
                      errors.tableNumber && styles.inputError,
                    ]}
                    onPress={() => {
                      setShowTablePicker(!showTablePicker);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                      clearError("tableNumber");
                    }}
                  >
                    <Text
                      style={[
                        styles.inputText,
                        !tableNumber && styles.placeholderText,
                      ]}
                    >
                      {tableNumber || "Select table"}
                    </Text>
                    {showTablePicker ? (
                      <ChevronUpIcon size={20} color="#A3A3A3" />
                    ) : (
                      <ChevronDownIcon size={20} color="#A3A3A3" />
                    )}
                  </Pressable>

                  {/* Table Options */}
                  {showTablePicker && (
                    <View style={styles.pickerOptions}>
                      {availableTables.map((table) => (
                        <Pressable
                          key={table.id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setTableNumber(table.label);
                            setShowTablePicker(false);
                            clearError("tableNumber");
                          }}
                        >
                          <Text style={styles.pickerOptionText}>
                            {table.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {errors.tableNumber && (
                    <Text style={styles.errorText}>{errors.tableNumber}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Meeting Link</Text>
                  <View
                    style={[
                      styles.linkInputContainer,
                      errors.meetingLink && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.linkInput}
                      placeholder="Paste your meeting link"
                      placeholderTextColor="#A3A3A3"
                      value={meetingLink}
                      onChangeText={(text) => {
                        setMeetingLink(text);
                        clearError("meetingLink");
                      }}
                    />
                    <Pressable style={styles.pasteButton}>
                      <Text style={styles.pasteButtonText}>Paste link</Text>
                    </Pressable>
                  </View>
                  {errors.meetingLink && (
                    <Text style={styles.errorText}>{errors.meetingLink}</Text>
                  )}
                </View>
              )}

              {/* Time Picker */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Time</Text>
                <Pressable
                  style={[styles.input, errors.time && styles.inputError]}
                  onPress={() => {
                    setShowTimePicker(!showTimePicker);
                    setShowDatePicker(false);
                    setShowTablePicker(false);
                    clearError("time");
                  }}
                >
                  <ClockIcon size={20} />
                  <Text
                    style={[
                      styles.inputText,
                      { marginLeft: 12 },
                      !selectedTime && styles.placeholderText,
                    ]}
                  >
                    {selectedTime || "Select time"}
                  </Text>
                  {showTimePicker ? (
                    <ChevronUpIcon size={20} color="#A3A3A3" />
                  ) : (
                    <ChevronDownIcon size={20} color="#A3A3A3" />
                  )}
                </Pressable>

                {/* Time Options */}
                {showTimePicker && (
                  <View style={styles.pickerOptions}>
                    {availableTimes.map((time) => (
                      <Pressable
                        key={time.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          setSelectedTime(time.label);
                          setShowTimePicker(false);
                          clearError("time");
                        }}
                      >
                        <ClockIcon size={20} active={true} />
                        <Text style={styles.pickerOptionText}>
                          {time.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {errors.time && (
                  <Text style={styles.errorText}>{errors.time}</Text>
                )}
              </View>

              {/* Description */}
              <View
                style={styles.fieldContainer}
                ref={descriptionFieldRef}
                onLayout={(e) => {
                  // Store the Y position of the description field relative to ScrollView
                  descriptionFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.label}>Description</Text>
                <View
                  style={[
                    styles.textAreaContainer,
                    errors.description && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.textArea}
                    placeholder="Briefly describe the meeting purpose..."
                    placeholderTextColor="#A3A3A3"
                    value={description}
                    onChangeText={(text) => {
                      setDescription(text);
                      clearError("description");
                    }}
                    onFocus={() => {
                      // Scroll to position description field just above keyboard, not all the way to top
                      setTimeout(() => {
                        if (
                          keyboardHeight > 0 &&
                          descriptionFieldY.current > 0
                        ) {
                          // Calculate available space above keyboard
                          const buttonAreaHeight = 100; // Button + safe area
                          const paddingAboveKeyboard = 20; // Space between field and keyboard
                          const fieldHeight = 150; // Approximate description field height
                          const availableSpace =
                            SCREEN_HEIGHT -
                            keyboardHeight -
                            buttonAreaHeight -
                            paddingAboveKeyboard;

                          // Calculate target position: field should be at availableSpace - fieldHeight
                          const targetFieldY = availableSpace - fieldHeight;

                          // Only scroll if current position is below target
                          if (descriptionFieldY.current > targetFieldY) {
                            const scrollAmount =
                              descriptionFieldY.current - targetFieldY;
                            scrollViewRef.current?.scrollTo({
                              y: Math.max(0, scrollAmount),
                              animated: true,
                            });
                          }
                        }
                      }, 300);
                    }}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                  <View style={styles.textAreaFooter}>
                    <Text style={styles.charCount}>
                      {description.length}/200
                    </Text>
                  </View>
                </View>
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <SafeAreaView edges={["bottom"]} style={styles.actionsContainer}>
            <Pressable
              style={[
                styles.submitButton,
                !isFormValid() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid()}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  !isFormValid() && styles.submitButtonTextDisabled,
                ]}
              >
                Send Meeting Request
              </Text>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    height: SCREEN_HEIGHT * 0.85,
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  draggableArea: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D4D4D4",
    borderRadius: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#171717",
    marginBottom: 16,
  },
  infoBanner: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  infoBannerText: {
    fontSize: 14,
    color: "#171717",
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#171717",
    marginBottom: 8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: "#171717",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 16,
    color: "#A3A3A3",
    fontWeight: "500",
  },
  segmentTextActive: {
    color: "#171717",
  },
  linkInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  linkInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#171717",
    minHeight: 48,
  },
  pasteButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    minHeight: 48,
  },
  pasteButtonText: {
    fontSize: 14,
    color: "#171717",
    fontWeight: "500",
  },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#171717",
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 18,
    color: "#22C55E",
    fontWeight: "bold",
  },
  textAreaContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    minHeight: 120,
    position: "relative",
  },
  textArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    fontSize: 16,
    color: "#171717",
    minHeight: 120,
  },
  textAreaFooter: {
    position: "absolute",
    bottom: 8,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  charCount: {
    fontSize: 12,
    color: "#A3A3A3",
    marginRight: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  submitButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  submitButtonTextDisabled: {
    color: "#A3A3A3",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
  placeholderText: {
    color: "#A3A3A3",
  },
});
