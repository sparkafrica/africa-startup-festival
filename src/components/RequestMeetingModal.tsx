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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "./icons";
import { meetingService, type MeetingSlot } from "../services/meetingService";
import { EVENT_ID } from "../config/env";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface RequestMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => void;
  attendeeName?: string;
  eventId?: number; // Allow override, defaults to EVENT_ID
}

export interface MeetingFormData {
  title: string;
  meetingType: "Physical" | "Virtual";
  tableNumber?: string;
  meetingLink?: string;
  date?: string;
  time?: string;
  description: string;
  // Backend-specific fields
  meeting_slot_id?: number; // The actual slot ID from backend
  slot?: MeetingSlot; // Full slot data for reference
}

export default function RequestMeetingModal({
  visible,
  onClose,
  onSubmit,
  attendeeName,
  eventId = EVENT_ID,
}: RequestMeetingModalProps) {
  const [meetingType, setMeetingType] = useState<"Physical" | "Virtual">(
    "Physical"
  );
  const [title, setTitle] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeKey, setSelectedTimeKey] = useState<string | null>(null); // Store timeKey for filtering
  const [selectedSlot, setSelectedSlot] = useState<MeetingSlot | null>(null);
  const [description, setDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Backend data
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

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

  // Fetch meeting slots when modal opens
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
      setSelectedTimeKey(null);
      setSelectedSlot(null);
      setDescription("");
      setShowDatePicker(false);
      setShowTimePicker(false);
      setKeyboardHeight(0);
      setErrors({});
      setSlotsError(null);

      // Fetch available meeting slots
      fetchMeetingSlots();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const fetchMeetingSlots = async () => {
    try {
      setIsLoadingSlots(true);
      setSlotsError(null);
      const response = await meetingService.getMeetingSlots(eventId);
      const availableSlots = response.slots.filter(slot => slot.is_available);
      setMeetingSlots(availableSlots);
      
      if (__DEV__) {
        console.log("📅 Fetched meeting slots:", {
          total: response.slots.length,
          available: availableSlots.length,
          slots: availableSlots.map(s => ({
            id: s.id,
            start: s.start_time,
            end: s.end_time,
            table: s.table_number,
            available: s.is_available
          }))
        });
      }
    } catch (error: any) {
      setSlotsError(error?.message || "Failed to load meeting slots");
      if (__DEV__) {
        console.error("❌ Error fetching meeting slots:", error);
      }
    } finally {
      setIsLoadingSlots(false);
    }
  };

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
        meeting_slot_id: selectedSlot?.id,
        slot: selectedSlot || undefined,
      };
      onSubmit(formData);
      // Reset form
      setTitle("");
      setTableNumber("");
      setMeetingLink("");
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedTimeKey(null);
      setSelectedSlot(null);
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

  // Format time from backend (HH:MM:SS) to display format (HH:MM AM/PM)
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Available dates for the event (25th and 26th June, 2026)
  // Show dates regardless of slot loading status - slots will be filtered by date selection
  const availableDates = [
    { id: "1", label: "25th June, 2026", value: "2026-06-25" },
    { id: "2", label: "26th June, 2026", value: "2026-06-26" },
  ];

  // Get slots for selected date (or all slots if no date selected yet)
  const getAvailableSlotsForDate = (): MeetingSlot[] => {
    // Since we're hardcoding dates and backend slots don't include date info,
    // return all slots regardless of date selection
    // In production, you would filter slots by the selected date value
    return meetingSlots;
  };

  // Get slots for the selected date
  const slotsForDate = getAvailableSlotsForDate();
  
  // Debug logging
  if (__DEV__ && selectedDate) {
    console.log("🔍 Date selected:", selectedDate);
    console.log("🔍 Total slots:", meetingSlots.length);
    console.log("🔍 Slots for date:", slotsForDate.length);
  }
  
  // Generate time options from available slots (remove duplicates)
  const uniqueTimeSlots = new Map<string, { slot: MeetingSlot; label: string }>();
  
  slotsForDate.forEach((slot: MeetingSlot) => {
    const timeKey = `${slot.start_time}-${slot.end_time}`;
    if (!uniqueTimeSlots.has(timeKey)) {
      uniqueTimeSlots.set(timeKey, {
        slot,
        label: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
      });
    }
  });

  const availableTimes = Array.from(uniqueTimeSlots.entries()).map(([timeKey, data]) => ({
    id: data.slot.id.toString(),
    label: data.label,
    value: timeKey,
    slotId: data.slot.id,
    tableNumber: data.slot.table_number,
  }));

  // Debug logging for times
  if (__DEV__ && selectedDate) {
    console.log("🔍 Available times:", availableTimes.length, availableTimes.map(t => t.label));
  }

  // Get all tables for selected time slot (multiple slots can have same time but different tables)
  // Use selectedTimeKey (e.g., "09:30:00-09:50:00") to match slots, not selectedTime (display label)
  const availableTables = selectedTimeKey
    ? slotsForDate
        .filter((slot: MeetingSlot) => `${slot.start_time}-${slot.end_time}` === selectedTimeKey)
        .map((slot: MeetingSlot) => ({
          id: slot.id.toString(),
          label: `Table ${slot.table_number}`,
          value: slot.table_number.toString(),
          slotId: slot.id,
        }))
    : [];

  // Debug logging for tables
  if (__DEV__ && selectedTimeKey) {
    console.log("🔍 Selected time (label):", selectedTime);
    console.log("🔍 Selected timeKey:", selectedTimeKey);
    console.log("🔍 Available tables:", availableTables.length, availableTables.map(t => t.label));
    if (availableTables.length === 0) {
      console.log("🔍 Debug: Matching slots for timeKey:", slotsForDate.filter((s: MeetingSlot) => `${s.start_time}-${s.end_time}` === selectedTimeKey).length);
    }
  }

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

              {/* Loading/Error State for Slots */}
              {isLoadingSlots && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1BB273" />
                  <Text style={styles.loadingText}>Loading available slots...</Text>
                </View>
              )}
              {slotsError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorBannerText}>{slotsError}</Text>
                  <Pressable onPress={fetchMeetingSlots} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              )}
              {!isLoadingSlots && !slotsError && meetingSlots.length === 0 && (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>
                    No meeting slots are currently available for this event. Please contact support or try again later.
                  </Text>
                </View>
              )}

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
                    {availableDates.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                          No available dates
                        </Text>
                      </View>
                    ) : (
                      availableDates.map((date) => (
                        <Pressable
                          key={date.id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setSelectedDate(date.label);
                            setSelectedTime(null); // Reset time when date changes
                            setSelectedTimeKey(null); // Reset timeKey
                            setTableNumber(""); // Reset table
                            setSelectedSlot(null);
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
                      ))
                    )}
                  </View>
                )}
                {errors.date && (
                  <Text style={styles.errorText}>{errors.date}</Text>
                )}
              </View>

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
                    {availableTimes.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                          {selectedDate
                            ? "No available times for this date"
                            : "Please select a date first"}
                        </Text>
                      </View>
                    ) : (
                      availableTimes.map((time) => (
                        <Pressable
                          key={time.id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setSelectedTime(time.label); // Display label for UI
                            setSelectedTimeKey(time.value); // TimeKey for filtering (e.g., "09:30:00-09:50:00")
                            setTableNumber(""); // Reset table when time changes
                            setShowTimePicker(false);
                            clearError("time");
                            
                            // If virtual or only one slot for this time, auto-select
                            if (meetingType === "Virtual" || availableTimes.filter(t => t.value === time.value).length === 1) {
                              const slot = meetingSlots.find(s => s.id === (time as any).slotId);
                              setSelectedSlot(slot || null);
                            }
                          }}
                        >
                          <ClockIcon size={20} active={true} />
                          <Text style={styles.pickerOptionText}>
                            {time.label}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
                {errors.time && (
                  <Text style={styles.errorText}>{errors.time}</Text>
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
                      {availableTables.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={styles.emptyStateText}>
                            Please select a date and time first
                          </Text>
                        </View>
                      ) : (
                        availableTables.map((table: any) => (
                          <Pressable
                            key={table.id}
                            style={styles.pickerOption}
                            onPress={() => {
                              setTableNumber(table.label);
                              setShowTablePicker(false);
                              clearError("tableNumber");
                              
                              // Set the selected slot
                              const slot = meetingSlots.find((s: MeetingSlot) => s.id === table.slotId);
                              setSelectedSlot(slot || null);
                            }}
                          >
                            <Text style={styles.pickerOptionText}>
                              {table.label}
                            </Text>
                            {tableNumber === table.label && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                  {errors.tableNumber && (
                    <Text style={styles.errorText}>{errors.tableNumber}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Meeting Link</Text>
                  <TextInput
                    style={[
                      styles.linkInputFull,
                      errors.meetingLink && styles.inputError,
                    ]}
                    placeholder="Paste your meeting link"
                    placeholderTextColor="#A3A3A3"
                    value={meetingLink}
                    onChangeText={(text) => {
                      setMeetingLink(text);
                      clearError("meetingLink");
                    }}
                  />
                  {errors.meetingLink && (
                    <Text style={styles.errorText}>{errors.meetingLink}</Text>
                  )}
                </View>
              )}

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
  linkInputFull: {
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#166534",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#A3A3A3",
  },
  noSlotsContainer: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noSlotsText: {
    fontSize: 14,
    color: "#991B1B",
    lineHeight: 20,
    textAlign: "center",
  },
});
