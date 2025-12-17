import React, { useRef, useEffect, useState } from "react";
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
import { ChevronDownIcon } from "./icons";

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
  const [date, setDate] = useState(initialData?.date || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  const translateY = useRef(new Animated.Value(0)).current;
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

  // Reset form when modal opens with initial data
  useEffect(() => {
    if (visible && initialData) {
      setTitle(initialData.title || "");
      setMeetingType(initialData.meetingType || "physical");
      setTableNumber(initialData.tableNumber || "Table 15");
      setMeetingLink(initialData.meetingLink || "");
      setTime(initialData.time || "10:30 AM - 10:50 AM");
      setDate(initialData.date || "");
      setDescription(initialData.description || "");
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (title.trim().length === 0) {
      // TODO: Show validation error
      return;
    }

    Keyboard.dismiss();
    onSave({
      title: title.trim(),
      meetingType,
      tableNumber: meetingType === "physical" ? tableNumber : undefined,
      meetingLink: meetingType === "virtual" ? meetingLink : undefined,
      time,
      date,
      description: description.trim(),
    });
  };

  const handlePasteLink = async () => {
    // TODO: Implement clipboard paste functionality
    // For now, just focus the input
  };

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
  const isSaveDisabled = title.trim().length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 bg-black/50">
          <Pressable className="flex-1" onPress={onClose} />
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY }],
              maxHeight: Dimensions.get("window").height * 0.75,
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
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="e.g., Product Discussion"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                  onSubmitEditing={handleTitleSubmit}
                />
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
                    }`}
                    onPress={() => setMeetingType("physical")}
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
                    }`}
                    onPress={() => setMeetingType("virtual")}
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
              </View>

              {/* Table Number (Physical) or Meeting Link (Virtual) */}
              {meetingType === "physical" ? (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Table Number
                  </Text>
                  <Pressable className="flex-row items-center justify-between bg-white border border-neutral-300 rounded-xl px-4 py-3.5">
                    <Text className="text-base text-black flex-1">
                      {tableNumber}
                    </Text>
                    <ChevronDownIcon size={20} color="#6B7280" />
                  </Pressable>
                </View>
              ) : (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-black mb-2">
                    Meeting Link
                  </Text>
                  <View className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-4 gap-2">
                    <TextInput
                      className="flex-1 py-3.5 text-base"
                      placeholder="Paste your meeting link"
                      placeholderTextColor="#9CA3AF"
                      value={meetingLink}
                      onChangeText={setMeetingLink}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={handleLinkSubmit}
                    />
                    <Pressable
                      className="bg-indigo-100 px-3 py-1.5 rounded-md"
                      onPress={handlePasteLink}
                    >
                      <Text className="text-sm font-medium text-indigo-600">
                        Paste link
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Date & Time */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Date & Time
                </Text>
                <Pressable className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-4 py-3.5 mb-3 gap-2">
                  <ClockIcon size={18} color="#404040" />
                  <Text className="flex-1 text-base font-medium text-black">
                    {time}
                  </Text>
                  <ChevronDownIcon size={20} color="#6B7280" />
                </Pressable>
                <Pressable className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-4 py-3.5 gap-2">
                  <Text className="text-lg">📅</Text>
                  <Text
                    className={`flex-1 text-base ${
                      !date ? "text-neutral-500" : "text-black"
                    }`}
                  >
                    {date || "Select date"}
                  </Text>
                  <ChevronDownIcon size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Description */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-black mb-2">
                  Description
                </Text>
                <View className="relative bg-white border border-neutral-300 rounded-xl p-3 min-h-[96px]">
                  <TextInput
                    className="text-base text-black min-h-[72px] pb-6"
                    placeholder="Briefly describe the meeting purpose..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={(text) => {
                      if (text.length <= MAX_CHARACTERS) {
                        setDescription(text);
                      }
                    }}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                  <View className="absolute bottom-2 right-3">
                    <Text className="text-xs text-neutral-500">
                      {characterCount}/{MAX_CHARACTERS}
                    </Text>
                  </View>
                </View>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
