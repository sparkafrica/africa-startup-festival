import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersonProfileIcon, ClockIcon, LocationPinIcon } from "./icons";
import { VideoIcon } from "./MenuIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

export interface CancelledMeetingDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  participantName: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType?: "physical" | "virtual";
  location?: string;
  meetingLink?: string;
  description?: string;
}

export default function CancelledMeetingDetailModal({
  visible,
  onClose,
  title,
  participantName,
  company,
  date,
  startTime,
  endTime,
  meetingType = "physical",
  location,
  meetingLink,
  description,
}: CancelledMeetingDetailModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !isClosingRef.current && Math.abs(gestureState.dy) > 5,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SCREEN_HEIGHT);
            isClosingRef.current = false;
            onClose();
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(SCREEN_HEIGHT);
      isClosingRef.current = false;
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={handleClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: MAX_MODAL_HEIGHT,
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black">Cancelled Meeting</Text>
          </View>

          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View
              className="rounded-full px-3 py-1 self-start mb-4"
              style={{ backgroundColor: "#FF3B30" }}
            >
              <Text className="text-white text-xs font-medium">Cancelled</Text>
            </View>

            <Text className="text-lg font-bold text-black mb-4">{title}</Text>

            <View className="flex-row items-center mb-3">
              <PersonProfileIcon size={18} color="#404040" />
              <Text className="text-base text-black ml-2">
                {participantName} • {company}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <ClockIcon size={18} active={false} />
              <Text className="text-base text-black ml-2">
                {date} • {startTime} - {endTime}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <VideoIcon size={18} color="#404040" />
              <Text className="text-base text-black ml-2">
                {meetingType === "virtual" ? "Virtual Meeting" : "Physical Meeting"}
              </Text>
            </View>

            {(location || meetingLink) && (
              <View className="flex-row items-start mb-3">
                <LocationPinIcon size={18} color="#404040" />
                <Text className="text-base text-black ml-2 flex-1">
                  {meetingType === "virtual" && meetingLink
                    ? meetingLink
                    : location || "—"}
                </Text>
              </View>
            )}

            {description ? (
              <View className="mt-4 pt-4 border-t border-neutral-200">
                <Text className="text-sm font-medium text-neutral-600 mb-2">
                  Meeting reason
                </Text>
                <Text className="text-base text-black">{description}</Text>
              </View>
            ) : null}
          </ScrollView>

          <SafeAreaView edges={["bottom"]} className="bg-white px-4 pb-4 pt-2">
            <Pressable
              onPress={handleClose}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-white">Close</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
