import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClockIcon } from "./BottomNavIcons";
import LoadingSpinner from "./LoadingSpinner";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";
import { meetingService, type MeetingSlot } from "../services/meetingService";
import { EVENT_ID } from "../config/env";
import MeetingCalendarPicker from "./MeetingCalendarPicker";
import MeetingTimePicker from "./MeetingTimePicker";
import {
  addDaysToIso,
  extractStartTimeDisplay,
  formatDateLong,
  parseDisplayTimeToApi,
  parseFlexibleDateToIso,
  todayIsoLocal,
} from "../utils/meetingDateTime";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_CHARACTERS = 200;

type MeetingType = "physical" | "virtual";

export interface EditMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    meetingType: MeetingType;
    tableNumber?: string;
    meetingLink?: string;
    time: string;
    date: string;
    description: string;
    timeApi?: string;
    slotId?: number;
  }) => void;
  initialData?: {
    title: string;
    meetingType: MeetingType;
    tableNumber?: string;
    meetingLink?: string;
    time: string;
    date: string;
    description: string;
  };
}

export default function EditMeetingModal({
  visible,
  onClose,
  onSave,
  initialData,
}: EditMeetingModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [meetingType, setMeetingType] = useState<MeetingType>(
    initialData?.meetingType || "physical"
  );
  const [tableNumber, setTableNumber] = useState(
    initialData?.tableNumber || "Table 15"
  );
  const [meetingLink, setMeetingLink] = useState(
    initialData?.meetingLink || ""
  );
  const [time, setTime] = useState(initialData?.time || "10:30 AM - 10:50 AM");
  const [selectedTimeApi, setSelectedTimeApi] = useState<string | null>(null);
  const [date, setDate] = useState(initialData?.date || "");
  const [selectedDateValue, setSelectedDateValue] = useState<string | null>(
    null,
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  // Validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    tableNumber?: string;
    meetingLink?: string;
    date?: string;
    time?: string;
    description?: string;
  }>({});

  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [selectedTimeKey, setSelectedTimeKey] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null); // Track selected slot ID
  
  // Meeting slots state
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Helper to clear specific error
  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  // Format time helper (HH:MM:SS to HH:MM AM/PM)
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const fetchMeetingSlots = async () => {
    try {
      setIsLoadingSlots(true);
      setSlotsError(null);
      const response = await meetingService.getMeetingSlots(EVENT_ID);
      const availableSlots = response.slots.filter((slot) => slot.is_available);
      setMeetingSlots(availableSlots);
    } catch (error: any) {
      setSlotsError("Failed to load meeting slots");
      if (__DEV__) {
        console.error("Error fetching meeting slots:", error);
      }
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Fetch slots when modal opens (physical rescheduling)
  useEffect(() => {
    if (visible && meetingType === "physical") {
      fetchMeetingSlots();
    }
  }, [visible, meetingType]);

  const isVirtualMeeting = meetingType === "virtual";
  const virtualMinDateIso = todayIsoLocal();
  const virtualMaxDateIso = addDaysToIso(virtualMinDateIso, 90);

  const slotDateNorm = (slot: MeetingSlot): string | null =>
    slot.date ? slot.date.slice(0, 10) : null;

  const physicalEnabledDates = useMemo(() => {
    const set = new Set<string>();
    meetingSlots.forEach((slot) => {
      const d = slotDateNorm(slot);
      if (d) set.add(d);
    });
    if (set.size === 0) {
      set.add("2026-06-26");
      set.add("2026-06-27");
    }
    return set;
  }, [meetingSlots]);

  // Reset form when modal opens with initial data
  useEffect(() => {
    if (visible && initialData) {
      setTitle(initialData.title || "");
      setMeetingType(initialData.meetingType || "physical");
      setTableNumber(initialData.tableNumber || "Table 15");
      setMeetingLink(initialData.meetingLink || "");
      const iso = parseFlexibleDateToIso(initialData.date || "");
      setSelectedDateValue(iso);
      setDate(iso ? formatDateLong(iso) : initialData.date || "");
      if (initialData.meetingType === "virtual") {
        const start = extractStartTimeDisplay(initialData.time || "");
        setTime(start);
        setSelectedTimeApi(parseDisplayTimeToApi(start));
      } else {
        setTime(initialData.time || "10:30 AM - 10:50 AM");
        setSelectedTimeApi(null);
      }
      setDescription(initialData.description || "");
      setErrors({});
      setShowDatePicker(false);
      setShowTimePicker(false);
      setShowTablePicker(false);
      setSelectedTimeKey(null);
      setSelectedSlotId(null);
    } else if (!visible) {
      setErrors({});
    }
  }, [visible, initialData]);

  // Match initial physical time to slot once slots load
  useEffect(() => {
    if (
      visible &&
      initialData &&
      meetingType === "physical" &&
      meetingSlots.length > 0 &&
      !selectedTimeKey
    ) {
      const initialTime = initialData.time;
      const targetDate =
        selectedDateValue || parseFlexibleDateToIso(initialData.date || "");
      if (!initialTime || !targetDate) return;
      const slotsForThisDate = meetingSlots.filter(
        (slot) => slotDateNorm(slot) === targetDate,
      );
      const matchingSlot = slotsForThisDate.find((slot) => {
        const slotLabel = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
        return slotLabel === initialTime;
      });
      if (matchingSlot) {
        setSelectedTimeKey(
          `${matchingSlot.start_time}-${matchingSlot.end_time}`,
        );
        setSelectedSlotId(matchingSlot.id);
      }
    }
  }, [
    visible,
    initialData,
    meetingSlots,
    selectedTimeKey,
    meetingType,
    selectedDateValue,
  ]);

  const slotsForDate = ((): MeetingSlot[] => {
    if (!selectedDateValue) return meetingSlots;
    return meetingSlots.filter(
      (slot) => slotDateNorm(slot) === selectedDateValue,
    );
  })();

  // Generate time options from available slots (for this date only)
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
  }));

  // Get tables for selected time (sorted by table_number for consistent UX)
  const availableTables = selectedTimeKey
    ? slotsForDate
        .filter((slot: MeetingSlot) => `${slot.start_time}-${slot.end_time}` === selectedTimeKey)
        .sort((a: MeetingSlot, b: MeetingSlot) => a.table_number - b.table_number)
        .map((slot: MeetingSlot) => ({
          id: slot.id.toString(),
          label: `Table ${slot.table_number}`,
          value: slot.table_number.toString(),
          slotId: slot.id,
        }))
    : [];

  // Keyboard event listeners
  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      keyboardOffset.setValue(0);
      return;
    }

    if (Platform.OS === "android") {
      // Android: Use keyboardDidShow/DidHide and set keyboardHeight state
      // The modal uses bottom = keyboardHeight to position itself
      const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
        const kbHeight = e.endCoordinates.height;
        setKeyboardHeight(kbHeight);
      });

      const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardHeight(0);
      });

      return () => {
        keyboardDidShow.remove();
        keyboardDidHide.remove();
      };
    } else {
      // iOS: Use existing translateY approach with keyboardOffset
      const keyboardWillShow = Keyboard.addListener("keyboardWillShow", (e) => {
        const kbHeight = e.endCoordinates.height;
        setKeyboardHeight(kbHeight);

        Animated.timing(keyboardOffset, {
          toValue: -kbHeight,
          duration: e.duration || 250,
          useNativeDriver: true,
        }).start();
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

  // Validation functions
  const validateTitle = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Meeting title is required";
    }
    if (trimmed.length < 3) {
      return "Meeting title must be at least 3 characters";
    }
    if (trimmed.length > 100) {
      return "Meeting title must be less than 100 characters";
    }
    return undefined;
  };

  const validateTableNumber = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Table number is required for physical meetings";
    }
    return undefined;
  };

  const validateMeetingLink = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Meeting link is required for virtual meetings";
    }
    // Basic URL validation
    try {
      const url = new URL(trimmed);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "Meeting link must be a valid HTTP or HTTPS URL";
      }
    } catch {
      return "Please enter a valid meeting link (e.g., https://meet.example.com)";
    }
    return undefined;
  };

  const validateDate = (): string | undefined => {
    if (!selectedDateValue) {
      return "Date is required";
    }
    return undefined;
  };

  const validateTime = (): string | undefined => {
    if (isVirtualMeeting) {
      if (!selectedTimeApi) return "Start time is required";
    } else if (!time.trim()) {
      return "Time is required";
    }
    return undefined;
  };

  const validateDescription = (value: string): string | undefined => {
    if (value.length > MAX_CHARACTERS) {
      return `Description must be less than ${MAX_CHARACTERS} characters`;
    }
    return undefined;
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};

    // Validate title
    const titleError = validateTitle(title);
    if (titleError) {
      newErrors.title = titleError;
    }

    // Validate based on meeting type
    if (meetingType === "physical") {
      const tableError = validateTableNumber(tableNumber);
      if (tableError) {
        newErrors.tableNumber = tableError;
      }
    } else {
      const linkError = validateMeetingLink(meetingLink);
      if (linkError) {
        newErrors.meetingLink = linkError;
      }
    }

    // Validate date
    const dateError = validateDate();
    if (dateError) {
      newErrors.date = dateError;
    }

    const timeError = validateTime();
    if (timeError) {
      newErrors.time = timeError;
    }

    // Validate description
    const descError = validateDescription(description);
    if (descError) {
      newErrors.description = descError;
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and save
    setErrors({});
    Keyboard.dismiss();
    const resolvedSlotId =
      meetingType === "physical"
        ? selectedSlotId || undefined
        : undefined;

    onSave({
      title: title.trim(),
      meetingType,
      tableNumber: meetingType === "physical" ? tableNumber.trim() : undefined,
      meetingLink: meetingType === "virtual" ? meetingLink.trim() : undefined,
      time: time.trim(),
      date: selectedDateValue || date.trim(),
      description: description.trim(),
      timeApi: isVirtualMeeting ? selectedTimeApi || undefined : undefined,
      slotId: resolvedSlotId,
    });
  };

  const handleSelectCalendarDate = (iso: string) => {
    setSelectedDateValue(iso);
    setDate(formatDateLong(iso));
    setTime(isVirtualMeeting ? "" : "");
    setSelectedTimeApi(null);
    setSelectedTimeKey(null);
    setTableNumber("");
    setSelectedSlotId(null);
    setShowDatePicker(false);
    clearError("date");
    clearError("time");
  };

  const renderDateTimeSection = () => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-black mb-2">Date & time</Text>

      <Pressable
        className={`flex-row items-center bg-white border rounded-xl px-4 py-3.5 mb-3 ${
          errors.date ? "border-red-500" : "border-neutral-300"
        }`}
        onPress={() => {
          setShowDatePicker(!showDatePicker);
          setShowTimePicker(false);
          setShowTablePicker(false);
          clearError("date");
        }}
      >
        <Text className="text-lg mr-2">📅</Text>
        <Text
          className={`flex-1 text-base ${
            !selectedDateValue ? "text-neutral-500" : "text-black"
          }`}
        >
          {selectedDateValue ? formatDateLong(selectedDateValue) : "Select date"}
        </Text>
        {showDatePicker ? (
          <ChevronUpIcon size={20} color="#6B7280" />
        ) : (
          <ChevronDownIcon size={20} color="#6B7280" />
        )}
      </Pressable>
      {showDatePicker ? (
        <View className="mb-3 bg-neutral-50 border border-neutral-300 rounded-xl p-3">
          <MeetingCalendarPicker
            selectedDateIso={selectedDateValue}
            minDateIso={virtualMinDateIso}
            maxDateIso={isVirtualMeeting ? virtualMaxDateIso : undefined}
            enabledDatesIso={isVirtualMeeting ? null : physicalEnabledDates}
            onSelectDate={handleSelectCalendarDate}
          />
        </View>
      ) : null}
      {errors.date ? (
        <Text className="text-red-500 text-xs mt-1 ml-1 mb-2">{errors.date}</Text>
      ) : null}

      <Pressable
        className={`flex-row items-center bg-white border rounded-xl px-4 py-3.5 mb-3 ${
          errors.time ? "border-red-500" : "border-neutral-300"
        }`}
        onPress={() => {
          if (!selectedDateValue) {
            setErrors((prev) => ({
              ...prev,
              date: "Select a date first",
            }));
            return;
          }
          setShowTimePicker(!showTimePicker);
          setShowDatePicker(false);
          setShowTablePicker(false);
          clearError("time");
        }}
      >
        <View className="mr-2">
          <ClockIcon size={18} color="#404040" />
        </View>
        <Text className="flex-1 text-base font-medium text-black">
          {time ||
            (isVirtualMeeting ? "Select start time" : "Select time slot")}
        </Text>
        {showTimePicker ? (
          <ChevronUpIcon size={20} color="#6B7280" />
        ) : (
          <ChevronDownIcon size={20} color="#6B7280" />
        )}
      </Pressable>
      {showTimePicker ? (
        <View className="mb-3 bg-white border border-neutral-300 rounded-xl max-h-52">
          {isVirtualMeeting ? (
            <MeetingTimePicker
              selectedTimeApi={selectedTimeApi}
              onSelectTime={(display, apiValue) => {
                setTime(display);
                setSelectedTimeApi(apiValue);
                setShowTimePicker(false);
                clearError("time");
              }}
            />
          ) : (
            <ScrollView nestedScrollEnabled>
              {isLoadingSlots ? (
                <View className="px-4 py-3 items-center">
                  <LoadingSpinner size="small" />
                </View>
              ) : availableTimes.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="text-sm text-neutral-500 text-center">
                    {slotsError || "No available times for this date"}
                  </Text>
                </View>
              ) : (
                availableTimes.map((timeOption) => (
                  <Pressable
                    key={timeOption.id}
                    className="px-4 py-3 border-b border-neutral-100 flex-row items-center justify-between"
                    onPress={() => {
                      setTime(timeOption.label);
                      setSelectedTimeKey(timeOption.value);
                      setSelectedSlotId(timeOption.slotId);
                      setShowTimePicker(false);
                      setTableNumber("");
                      clearError("time");
                    }}
                  >
                    <Text className="text-base text-black">
                      {timeOption.label}
                    </Text>
                    {time === timeOption.label ? (
                      <Text className="text-green-600 font-semibold">✓</Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
        </View>
      ) : null}
      {errors.time ? (
        <Text className="text-red-500 text-xs mt-1 ml-1">{errors.time}</Text>
      ) : null}
    </View>
  );

  // Keyboard navigation handlers
  const handleTitleSubmit = () => {
    if (meetingType === "physical") {
      // Skip to description for physical meetings
    } else {
      // Focus link input for virtual meetings
    }
  };

  const handleLinkSubmit = () => {
    // Focus description
  };

  const characterCount = description.length;
  // Save button is enabled if title has at least 3 characters
  const isSaveDisabled = title.trim().length < 3;

  // Combine translateY and keyboardOffset for iOS only
  const combinedTranslateY = Animated.add(translateY, keyboardOffset);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        {Platform.OS === "android" ? (
          <View
            className="bg-white rounded-t-3xl"
            style={{
              position: "absolute",
              bottom: keyboardHeight,
              left: 0,
              right: 0,
              width: "100%",
              maxHeight: SCREEN_HEIGHT * 0.75,
            }}
          >
            <View className="items-center pt-2 pb-2">
              <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
              <Text className="text-xl font-semibold text-black mb-4 px-4 self-start">
                Edit Meeting
              </Text>
            </View>

            {/* Notification Info Bar */}
            <View className="px-4 mb-4">
              <View
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: "#FFF4E6" }}
              >
                <Text className="text-sm text-black leading-5">
                  Changes require the other person's approval. They'll receive
                  an email and notification.
                </Text>
              </View>
            </View>

            <ScrollView
              className="px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Meeting Title */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Meeting Title
                </Text>
                <TextInput
                  className={`bg-white border rounded-xl px-4 py-3.5 text-base ${
                    errors.title ? "border-red-500" : "border-neutral-300"
                  }`}
                  placeholder="e.g., Product Discussion"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    // Clear error when user starts typing
                    if (errors.title) {
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={handleTitleSubmit}
                />
                {errors.title && (
                  <Text className="text-red-500 text-xs mt-1 ml-1">
                    {errors.title}
                  </Text>
                )}
              </View>

              {/* Meeting Type */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Meeting Type
                </Text>
                <View className="flex-row bg-neutral-100 rounded-xl p-1 gap-1">
                  <Pressable
                    className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
                      meetingType === "physical"
                        ? "bg-white shadow-sm"
                        : "bg-transparent"
                    } ${initialData ? "opacity-50" : ""}`}
                    onPress={() => {
                      // Disable type change when editing an existing meeting
                      if (!initialData) {
                        setMeetingType("physical");
                      }
                    }}
                    disabled={!!initialData}
                  >
                    <Text
                      className={`text-base font-medium ${
                        meetingType === "physical"
                          ? "text-black"
                          : "text-neutral-500"
                      }`}
                    >
                      Physical
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
                      meetingType === "virtual"
                        ? "bg-white shadow-sm"
                        : "bg-transparent"
                    } ${initialData ? "opacity-50" : ""}`}
                    onPress={() => {
                      // Disable type change when editing an existing meeting
                      if (!initialData) {
                        setMeetingType("virtual");
                      }
                    }}
                    disabled={!!initialData}
                  >
                    <Text
                      className={`text-base font-medium ${
                        meetingType === "virtual"
                          ? "text-black"
                          : "text-neutral-500"
                      }`}
                    >
                      Virtual
                    </Text>
                  </Pressable>
                </View>
                {initialData && (
                  <Text className="text-xs text-neutral-500 mt-1 ml-1">
                    Meeting type cannot be changed when editing
                  </Text>
                )}
              </View>

              {/* Meeting Link (Virtual) - Only for virtual meetings, shown BEFORE Date & Time */}
              {meetingType === "virtual" && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Meeting Link
                  </Text>
                  <TextInput
                    className={`bg-white border rounded-xl px-4 py-3.5 text-base ${
                      errors.meetingLink
                        ? "border-red-500"
                        : "border-neutral-300"
                    }`}
                    placeholder="https://meet.google.com/..."
                    placeholderTextColor="#9CA3AF"
                    value={meetingLink}
                    onChangeText={(text) => {
                      setMeetingLink(text);
                      // Clear error when user starts typing
                      if (errors.meetingLink) {
                        setErrors((prev) => ({
                          ...prev,
                          meetingLink: undefined,
                        }));
                      }
                    }}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleLinkSubmit}
                  />
                  {errors.meetingLink && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">
                      {errors.meetingLink}
                    </Text>
                  )}
                </View>
              )}

              {renderDateTimeSection()}

              {/* Table Number (Physical) - Only for physical meetings, shown AFTER Date & Time */}
              {meetingType === "physical" && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Table Number
                  </Text>
                  <Pressable
                    className={`flex-row items-center justify-between bg-white border rounded-xl px-4 py-3.5 ${
                      errors.tableNumber
                        ? "border-red-500"
                        : "border-neutral-300"
                    }`}
                    onPress={() => {
                      if (!selectedTimeKey) {
                        setErrors((prev) => ({ ...prev, tableNumber: "Please select a time first" }));
                        return;
                      }
                      setShowTablePicker(!showTablePicker);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                      clearError("tableNumber");
                    }}
                  >
                    <Text className="text-base text-black flex-1">
                      {tableNumber}
                    </Text>
                    {showTablePicker ? (
                      <ChevronUpIcon size={20} color="#6B7280" />
                    ) : (
                      <ChevronDownIcon size={20} color="#6B7280" />
                    )}
                  </Pressable>
                  {showTablePicker && (
                    <View className="mt-2 bg-white border border-neutral-300 rounded-xl max-h-48">
                      <ScrollView nestedScrollEnabled={true}>
                        {availableTables.length === 0 ? (
                          <View className="px-4 py-3">
                            <Text className="text-sm text-neutral-500 text-center">
                              Please select a time first
                            </Text>
                          </View>
                        ) : (
                          availableTables.map((table: any) => (
                            <Pressable
                              key={table.id}
                              className="px-4 py-3 border-b border-neutral-100 flex-row items-center justify-between"
                              onPress={() => {
                                setTableNumber(table.label);
                                setSelectedSlotId(table.slotId); // Store selected slot ID
                                setShowTablePicker(false);
                                clearError("tableNumber");
                              }}
                            >
                              <Text className="text-base text-black">
                                {table.label}
                              </Text>
                              {tableNumber === table.label && (
                                <Text className="text-green-600 font-semibold">✓</Text>
                              )}
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                  {errors.tableNumber && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">
                      {errors.tableNumber}
                    </Text>
                  )}
                </View>
              )}

              {/* Description */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-black mb-2">
                  Description
                </Text>
                <View
                  className={`relative bg-white border rounded-xl p-3 min-h-[96px] ${
                    errors.description ? "border-red-500" : "border-neutral-300"
                  }`}
                >
                  <TextInput
                    className="text-base text-black min-h-[72px] pb-6"
                    placeholder="Briefly describe the meeting purpose..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={(text) => {
                      if (text.length <= MAX_CHARACTERS) {
                        setDescription(text);
                        // Clear error when user starts typing
                        if (errors.description) {
                          setErrors((prev) => ({
                            ...prev,
                            description: undefined,
                          }));
                        }
                      }
                    }}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                  <View className="absolute bottom-2 right-3">
                    <Text
                      className={`text-xs ${
                        characterCount > MAX_CHARACTERS
                          ? "text-red-500"
                          : "text-neutral-500"
                      }`}
                    >
                      {characterCount}/{MAX_CHARACTERS}
                    </Text>
                  </View>
                </View>
                {errors.description && (
                  <Text className="text-red-500 text-xs mt-1 ml-1">
                    {errors.description}
                  </Text>
                )}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={handleSave}
                disabled={isSaveDisabled}
                className={`w-full items-center justify-center rounded-xl py-4 px-4 mb-3 ${
                  isSaveDisabled ? "bg-neutral-200" : "bg-black"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    isSaveDisabled ? "text-neutral-400" : "text-white"
                  }`}
                >
                  Send Meeting Update
                </Text>
              </Pressable>
            </ScrollView>
            <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
          </View>
        ) : (
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY: combinedTranslateY }],
              maxHeight: SCREEN_HEIGHT * 0.75,
            }}
          >
            <View
              className="items-center pt-2 pb-2"
              {...panResponder.panHandlers}
            >
              <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
              <Text className="text-xl font-semibold text-black mb-4 px-4 self-start">
                Edit Meeting
              </Text>
            </View>

            {/* Notification Info Bar */}
            <View className="px-4 mb-4">
              <View
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: "#FFF4E6" }}
              >
                <Text className="text-sm text-black leading-5">
                  Changes require the other person's approval. They'll receive
                  an email and notification.
                </Text>
              </View>
            </View>

            <ScrollView
              className="px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Meeting Title */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Meeting Title
                </Text>
                <TextInput
                  className={`bg-white border rounded-xl px-4 py-3.5 text-base ${
                    errors.title ? "border-red-500" : "border-neutral-300"
                  }`}
                  placeholder="e.g., Product Discussion"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    // Clear error when user starts typing
                    if (errors.title) {
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={handleTitleSubmit}
                />
                {errors.title && (
                  <Text className="text-red-500 text-xs mt-1 ml-1">
                    {errors.title}
                  </Text>
                )}
              </View>

              {/* Meeting Type */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Meeting Type
                </Text>
                <View className="flex-row bg-neutral-100 rounded-xl p-1 gap-1">
                  <Pressable
                    className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
                      meetingType === "physical"
                        ? "bg-white shadow-sm"
                        : "bg-transparent"
                    } ${initialData ? "opacity-50" : ""}`}
                    onPress={() => {
                      // Disable type change when editing an existing meeting
                      if (!initialData) {
                        setMeetingType("physical");
                      }
                    }}
                    disabled={!!initialData}
                  >
                    <Text
                      className={`text-base font-medium ${
                        meetingType === "physical"
                          ? "text-black"
                          : "text-neutral-500"
                      }`}
                    >
                      Physical
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-2.5 px-4 rounded-lg items-center ${
                      meetingType === "virtual"
                        ? "bg-white shadow-sm"
                        : "bg-transparent"
                    } ${initialData ? "opacity-50" : ""}`}
                    onPress={() => {
                      // Disable type change when editing an existing meeting
                      if (!initialData) {
                        setMeetingType("virtual");
                      }
                    }}
                    disabled={!!initialData}
                  >
                    <Text
                      className={`text-base font-medium ${
                        meetingType === "virtual"
                          ? "text-black"
                          : "text-neutral-500"
                      }`}
                    >
                      Virtual
                    </Text>
                  </Pressable>
                </View>
                {initialData && (
                  <Text className="text-xs text-neutral-500 mt-1 ml-1">
                    Meeting type cannot be changed when editing
                  </Text>
                )}
              </View>

              {/* Meeting Link (Virtual) - Only for virtual meetings, shown BEFORE Date & Time */}
              {meetingType === "virtual" && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Meeting Link
                  </Text>
                  <TextInput
                    className={`bg-white border rounded-xl px-4 py-3.5 text-base ${
                      errors.meetingLink
                        ? "border-red-500"
                        : "border-neutral-300"
                    }`}
                    placeholder="https://meet.google.com/..."
                    placeholderTextColor="#9CA3AF"
                    value={meetingLink}
                    onChangeText={(text) => {
                      setMeetingLink(text);
                      // Clear error when user starts typing
                      if (errors.meetingLink) {
                        setErrors((prev) => ({
                          ...prev,
                          meetingLink: undefined,
                        }));
                      }
                    }}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleLinkSubmit}
                  />
                  {errors.meetingLink && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">
                      {errors.meetingLink}
                    </Text>
                  )}
                </View>
              )}

              {renderDateTimeSection()}

              {/* Table Number (Physical) - Only for physical meetings, shown AFTER Date & Time */}
              {meetingType === "physical" && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Table Number
                  </Text>
                  <Pressable
                    className={`flex-row items-center justify-between bg-white border rounded-xl px-4 py-3.5 ${
                      errors.tableNumber
                        ? "border-red-500"
                        : "border-neutral-300"
                    }`}
                    onPress={() => {
                      if (!selectedTimeKey) {
                        setErrors((prev) => ({ ...prev, tableNumber: "Please select a time first" }));
                        return;
                      }
                      setShowTablePicker(!showTablePicker);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                      clearError("tableNumber");
                    }}
                  >
                    <Text className="text-base text-black flex-1">
                      {tableNumber}
                    </Text>
                    {showTablePicker ? (
                      <ChevronUpIcon size={20} color="#6B7280" />
                    ) : (
                      <ChevronDownIcon size={20} color="#6B7280" />
                    )}
                  </Pressable>
                  {showTablePicker && (
                    <View className="mt-2 bg-white border border-neutral-300 rounded-xl max-h-48">
                      <ScrollView nestedScrollEnabled={true}>
                        {availableTables.length === 0 ? (
                          <View className="px-4 py-3">
                            <Text className="text-sm text-neutral-500 text-center">
                              Please select a time first
                            </Text>
                          </View>
                        ) : (
                          availableTables.map((table: any) => (
                            <Pressable
                              key={table.id}
                              className="px-4 py-3 border-b border-neutral-100 flex-row items-center justify-between"
                              onPress={() => {
                                setTableNumber(table.label);
                                setSelectedSlotId(table.slotId); // Store selected slot ID
                                setShowTablePicker(false);
                                clearError("tableNumber");
                              }}
                            >
                              <Text className="text-base text-black">
                                {table.label}
                              </Text>
                              {tableNumber === table.label && (
                                <Text className="text-green-600 font-semibold">✓</Text>
                              )}
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                  {errors.tableNumber && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">
                      {errors.tableNumber}
                    </Text>
                  )}
                </View>
              )}

              {/* Description */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-black mb-2">
                  Description
                </Text>
                <View
                  className={`relative bg-white border rounded-xl p-3 min-h-[96px] ${
                    errors.description ? "border-red-500" : "border-neutral-300"
                  }`}
                >
                  <TextInput
                    className="text-base text-black min-h-[72px] pb-6"
                    placeholder="Briefly describe the meeting purpose..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={(text) => {
                      if (text.length <= MAX_CHARACTERS) {
                        setDescription(text);
                        // Clear error when user starts typing
                        if (errors.description) {
                          setErrors((prev) => ({
                            ...prev,
                            description: undefined,
                          }));
                        }
                      }
                    }}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                  <View className="absolute bottom-2 right-3">
                    <Text
                      className={`text-xs ${
                        characterCount > MAX_CHARACTERS
                          ? "text-red-500"
                          : "text-neutral-500"
                      }`}
                    >
                      {characterCount}/{MAX_CHARACTERS}
                    </Text>
                  </View>
                </View>
                {errors.description && (
                  <Text className="text-red-500 text-xs mt-1 ml-1">
                    {errors.description}
                  </Text>
                )}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={handleSave}
                disabled={isSaveDisabled}
                className={`w-full items-center justify-center rounded-xl py-4 px-4 mb-3 ${
                  isSaveDisabled ? "bg-neutral-200" : "bg-black"
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    isSaveDisabled ? "text-neutral-400" : "text-white"
                  }`}
                >
                  Send Meeting Update
                </Text>
              </Pressable>
            </ScrollView>
            <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
