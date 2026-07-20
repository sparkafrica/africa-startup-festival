import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  getTicketGradientColors,
  isLightTicketCard,
} from "../utils/ticketColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface TicketBenefitsModalProps {
  visible: boolean;
  onClose: () => void;
  tierLabel: string;
  ticketType?: string;
  items: string[];
}

function CheckIcon({ color = "#10B981" }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TicketBenefitsModal({
  visible,
  onClose,
  tierLabel,
  ticketType,
  items,
}: TicketBenefitsModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5 && gestureState.dy > 0,
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
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
    }),
  ).current;

  useEffect(() => {
    if (visible) {
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

  const gradient = getTicketGradientColors(ticketType ?? tierLabel);
  const isLightCard = isLightTicketCard(ticketType ?? tierLabel);
  const headerTextColor = isLightCard ? "text-black" : "text-white";
  const headerSubTextColor = isLightCard ? "text-black/70" : "text-white/80";

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{ transform: [{ translateY }], maxHeight: SCREEN_HEIGHT * 0.70 }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-3" />
          </View>

          <View className="px-4 pb-3">
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 0, padding: 16 }}
            >
              <Text className={`text-xs uppercase tracking-wide ${headerSubTextColor}`}>
                Your Ticket Benefits
              </Text>
              <Text className={`text-xl font-bold mt-1 ${headerTextColor}`}>
                {tierLabel} Pass
              </Text>
            </LinearGradient>
          </View>

          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {items.map((item, idx) => (
              <View
                key={`${idx}-${item}`}
                className="flex-row items-start py-3 border-b border-neutral-100"
              >
                <View className="w-6 h-6 items-center justify-center mt-0.5">
                  <CheckIcon color="#10B981" />
                </View>
                <Text className="text-[15px] text-neutral-800 flex-1 leading-5">
                  {item}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="px-4 pt-2 pb-6">
            <Pressable
              onPress={onClose}
              className="items-center justify-center bg-black rounded-xl py-3.5"
            >
              <Text className="text-sm font-semibold text-white">Close</Text>
            </Pressable>
          </View>

          <SafeAreaView edges={["bottom"]} className="bg-white" />
        </Animated.View>
      </View>
    </Modal>
  );
}
