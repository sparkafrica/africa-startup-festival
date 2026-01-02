import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Svg, { Path, Rect, Circle } from "react-native-svg";

// Checkmark Icon
function CheckmarkIcon({
  size = 32,
  color = "#10B981",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Checkbox Icon
function CheckboxIcon({
  checked = false,
  size = 24,
}: {
  checked?: boolean;
  size?: number;
}) {
  if (checked) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <Path
          d="M8 12L11 15L16 9"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </Svg>
  );
}

function ChevronDownIcon({
  size = 16,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const COUNTRIES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
];

function RecipientDetailsModal({
  visible,
  onClose,
  onTransfer,
}: {
  visible: boolean;
  onClose: () => void;
  onTransfer: (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "+234") || COUNTRIES[2]
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameFieldRef = useRef<View>(null);
  const emailFieldRef = useRef<View>(null);
  const phoneFieldRef = useRef<View>(null);
  const fullNameFieldY = useRef(0);
  const emailFieldY = useRef(0);
  const phoneFieldY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
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
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
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
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.setValue(0);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setShowCountryPicker(false);
      setKeyboardHeight(0);
    } else {
      translateY.setValue(0);
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

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

  const handleTransfer = () => {
    // Basic required field validation
    if (!fullName.trim()) {
      Alert.alert("Required Field", "Please enter the recipient's full name");
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        "Required Field",
        "Please enter the recipient's email address"
      );
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    // Phone number validation (if provided)
    if (phoneNumber.trim()) {
      // Remove any non-digit characters for validation
      const digitsOnly = phoneNumber.replace(/\D/g, "");

      // Validate length (typically 7-15 digits)
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        Alert.alert(
          "Invalid Phone",
          "Phone number must be between 7 and 15 digits"
        );
        return;
      }
    }

    // All validations passed
    onTransfer({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      countryCode,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable
          className="flex-1"
          onPress={() => {
            onClose();
            setShowCountryPicker(false);
          }}
        />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: Dimensions.get("window").height * 0.9,
            height: Dimensions.get("window").height * 0.85,
            flexDirection: "column",
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-6">
              Recipient Details
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, minHeight: 0 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              className="px-4"
              style={{ flex: 1, minHeight: 0, backgroundColor: "#FFFFFF" }}
              contentContainerStyle={{
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 50 : 20,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <View className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-6">
                <Text className="text-sm text-black leading-5">
                  Recipient will receive an email for their assigned pass and
                  must accept the allocation.
                </Text>
              </View>

              <View
                className="mb-4"
                ref={fullNameFieldRef}
                onLayout={(e) => {
                  fullNameFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  Full Name
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="Jane Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => {
                    setTimeout(() => {
                      if (keyboardHeight > 0 && fullNameFieldY.current > 0) {
                        const buttonAreaHeight = 100;
                        const paddingAboveKeyboard = 20;
                        const fieldHeight = 60;
                        const availableSpace =
                          Dimensions.get("window").height -
                          keyboardHeight -
                          buttonAreaHeight -
                          paddingAboveKeyboard;
                        const targetFieldY = availableSpace - fieldHeight;
                        if (fullNameFieldY.current > targetFieldY) {
                          const scrollAmount =
                            fullNameFieldY.current - targetFieldY;
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, scrollAmount),
                            animated: true,
                          });
                        }
                      }
                    }, 300);
                  }}
                />
              </View>

              <View
                className="mb-4"
                ref={emailFieldRef}
                onLayout={(e) => {
                  emailFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  Email
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="janedoe@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => {
                    setTimeout(() => {
                      if (keyboardHeight > 0 && emailFieldY.current > 0) {
                        const buttonAreaHeight = 100;
                        const paddingAboveKeyboard = 20;
                        const fieldHeight = 60;
                        const availableSpace =
                          Dimensions.get("window").height -
                          keyboardHeight -
                          buttonAreaHeight -
                          paddingAboveKeyboard;
                        const targetFieldY = availableSpace - fieldHeight;
                        if (emailFieldY.current > targetFieldY) {
                          const scrollAmount =
                            emailFieldY.current - targetFieldY;
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, scrollAmount),
                            animated: true,
                          });
                        }
                      }
                    }, 300);
                  }}
                />
              </View>

              <View
                className="mb-6"
                ref={phoneFieldRef}
                onLayout={(e) => {
                  phoneFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  Phone Number
                </Text>
                <View className="flex-row gap-2">
                  <View className="relative">
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-3 py-3.5"
                    >
                      <Text className="text-lg mr-1">
                        {selectedCountry.flag}
                      </Text>
                      <Text className="text-base font-medium text-black mr-1">
                        {selectedCountry.code}
                      </Text>
                      <ChevronDownIcon size={14} color="#000000" />
                    </Pressable>
                    {showCountryPicker && (
                      <View
                        className="absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg z-50 max-h-64"
                        style={{ width: 280 }}
                      >
                        <ScrollView
                          className="max-h-64"
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {COUNTRIES.map((country) => (
                            <Pressable
                              key={country.code}
                              onPress={() => {
                                setSelectedCountry(country);
                                setCountryCode(country.code);
                                setShowCountryPicker(false);
                              }}
                              className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100"
                            >
                              <View className="flex-row items-center">
                                <Text className="text-base mr-2">
                                  {country.flag}
                                </Text>
                                <Text className="text-base text-black">
                                  {country.code}
                                </Text>
                              </View>
                              <Text className="text-sm text-neutral-600 flex-1 text-right ml-2">
                                {country.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                    placeholder="(000) 000-0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => {
                      setTimeout(() => {
                        if (keyboardHeight > 0 && phoneFieldY.current > 0) {
                          const buttonAreaHeight = 100;
                          const paddingAboveKeyboard = 20;
                          const fieldHeight = 60;
                          const availableSpace =
                            Dimensions.get("window").height -
                            keyboardHeight -
                            buttonAreaHeight -
                            paddingAboveKeyboard;
                          const targetFieldY = availableSpace - fieldHeight;
                          if (phoneFieldY.current > targetFieldY) {
                            const scrollAmount =
                              phoneFieldY.current - targetFieldY;
                            scrollViewRef.current?.scrollTo({
                              y: Math.max(0, scrollAmount),
                              animated: true,
                            });
                          }
                        }
                      }, 300);
                    }}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <SafeAreaView
            edges={["bottom"]}
            className="bg-white"
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 20,
              borderTopWidth: 1,
              borderTopColor: "#F5F5F5",
            }}
          >
            <Pressable
              onPress={handleTransfer}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4 mb-3"
            >
              <Text className="text-base font-medium text-white">Transfer</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="w-full items-center justify-center bg-white border border-neutral-300 rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-black">Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function TicketTransferConfirmationModal({
  visible,
  onClose,
  ticketCount,
  recipientName,
  onComplete,
}: {
  visible: boolean;
  onClose: () => void;
  ticketCount: number;
  recipientName: string;
  onComplete: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
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
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
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
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.setValue(0);
    } else {
      translateY.setValue(0);
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          <View className="px-4 pb-6">
            <View className="items-center mb-6">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: "#D1FAE5" }}
              >
                <CheckmarkIcon size={48} color="#10B981" />
              </View>
            </View>

            <View className="items-center mb-2">
              <Text className="text-2xl font-bold text-black text-center">
                Tickets Transferred!
              </Text>
            </View>

            <View className="items-center mb-8">
              <Text className="text-base text-neutral-500 text-center">
                {ticketCount} ticket{ticketCount > 1 ? "s" : ""} transferred to{" "}
                {recipientName}
              </Text>
            </View>

            <Pressable
              onPress={onComplete}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-white">
                Continue to Profile
              </Text>
            </Pressable>
          </View>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

interface Ticket {
  id: string;
  type: string;
  ticketId: string;
  assignedTo?: string;
  color: string;
}

// TODO: BACKEND INTEGRATION - Replace mock ticket data with API call
// API Endpoint: GET /api/user/tickets
// Request Headers: { Authorization: `Bearer ${token}` }
// Response: { tickets: Ticket[] }
// Real-time: Consider WebSocket for ticket updates (transfers, assignments)
// TODO: BACKEND - Fetch tickets on component mount
// TODO: BACKEND - Handle loading and error states
// TODO: BACKEND - Cache tickets in state management (Redux/Context)
const mockTickets: Ticket[] = [
  {
    id: "1",
    type: "Founder Pass",
    ticketId: "#SPK2025-1234",
    assignedTo: "John Doe",
    color: "#000000",
  },
  {
    id: "2",
    type: "Exhibitor Pass",
    ticketId: "#SPK2025-5678",
    color: "#10B981",
  },
  {
    id: "3",
    type: "Attendee Pass",
    ticketId: "#SPK2025-5678",
    color: "#3B82F6",
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { markWelcomeSeen } = useAuth();
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mark welcome as seen when component mounts
  // This happens after navigation, so AppNavigator won't reset
  useEffect(() => {
    markWelcomeSeen();
  }, [markWelcomeSeen]);

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [recipientData, setRecipientData] = useState<{
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  } | null>(null);

  const handleTransferTickets = () => {
    if (selectedTickets.length === 0) {
      return;
    }
    // Open recipient details modal
    setRecipientModalVisible(true);
  };

  const handleRecipientTransfer = (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => {
    setRecipientData(data);
    setRecipientModalVisible(false);
    setTimeout(() => {
      setConfirmationModalVisible(true);
    }, 300);
  };

  const handleTransferComplete = () => {
    // TODO: Call API to transfer tickets
    // await api.post('/tickets/transfer', {
    //   ticketIds: selectedTickets,
    //   recipient: recipientData
    // });

    console.log("Transferring tickets:", {
      ticketIds: selectedTickets,
      recipient: recipientData,
    });

    // Close confirmation and proceed to profile
    setConfirmationModalVisible(false);
    setRecipientData(null);
    setSelectedTickets([]);

    // Navigate to profile completion
    navigation.navigate("CompleteProfile");
  };

  const handleSkip = () => {
    // Navigate to CompleteProfile screen for initial profile setup
    navigation.navigate("CompleteProfile");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8">
          {/* Success Checkmark */}
          <View className="items-center mb-6">
            <View className="w-28 h-28 rounded-full bg-green-50 items-center justify-center border-2 border-green-200">
              <CheckmarkIcon size={60} color="#10B981" />
            </View>
          </View>

          {/* Welcome Message */}
          <Text className="text-[30px] font-medium text-neutral-900 text-center mb-2">
            Welcome to ATE 2026!
          </Text>
          <Text className="text-base text-neutral-600 text-center mb-6">
            You have {mockTickets.length} tickets in your quota
          </Text>

          {/* Instructional Banner */}
          <View
            className="rounded-xl p-4 mb-6"
            style={{
              backgroundColor: "#FEF3C7",
              borderWidth: 1,
              borderColor: "#FDE68A",
            }}
          >
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Transfer tickets to team members or attendees
            </Text>
            <Text className="text-xs text-neutral-700">
              Select tickets below to transfer, or skip to continue to your
              profile
            </Text>
          </View>

          {/* Your Tickets Heading */}
          <Text className="text-[16px] font-semibold text-neutral-900 mb-4">
            Your Tickets ({mockTickets.length})
          </Text>

          {/* Ticket Cards */}
          <View className="gap-4 mb-12">
            {mockTickets.map((ticket) => {
              const isSelected = selectedTickets.includes(ticket.id);
              return (
                <Pressable
                  key={ticket.id}
                  onPress={() => toggleTicketSelection(ticket.id)}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    backgroundColor: ticket.color,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* Checkbox */}
                  <View className="absolute top-4 right-4">
                    <CheckboxIcon checked={isSelected} size={24} />
                  </View>

                  {/* Diagonal Pattern Background */}
                  <View
                    className="absolute right-0 top-0 bottom-0 w-32 opacity-10"
                    style={{
                      backgroundColor: "#FFFFFF",
                      transform: [{ rotate: "45deg" }],
                    }}
                  />

                  {/* Ticket Content */}
                  <View className="relative z-10">
                    <Text className="text-2xl font-bold text-white mb-2">
                      {ticket.type}
                    </Text>
                    <Text className="text-sm text-neutral-300 mb-3">
                      {ticket.ticketId}
                    </Text>
                    {ticket.assignedTo && (
                      <View className="flex-row items-center">
                        <Text className="text-sm text-neutral-300">
                          Assigned to{" "}
                        </Text>
                        <Text className="text-sm font-semibold text-white">
                          {ticket.assignedTo}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pt-4 pb-6"
        style={{
          paddingBottom: 34,
        }}
      >
        {/* Transfer Tickets Button */}
        <Pressable
          onPress={handleTransferTickets}
          disabled={selectedTickets.length === 0 || isProcessing}
          className={`rounded-xl py-4 items-center justify-center mb-3 ${
            selectedTickets.length > 0 && !isProcessing
              ? "bg-black"
              : "bg-neutral-300"
          }`}
          style={{
            opacity: selectedTickets.length > 0 && !isProcessing ? 1 : 0.6,
          }}
        >
          <Text className="text-white text-base font-semibold">
            Transfer Tickets
          </Text>
        </Pressable>

        {/* Skip Button */}
        <Pressable
          onPress={handleSkip}
          disabled={isProcessing}
          className="bg-white border-2 border-neutral-300 rounded-xl py-4 items-center justify-center"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text className="text-black text-base font-semibold">
              Skip for now
            </Text>
          )}
        </Pressable>
      </View>

      {/* Transfer Modals */}
      <RecipientDetailsModal
        visible={recipientModalVisible}
        onClose={() => setRecipientModalVisible(false)}
        onTransfer={handleRecipientTransfer}
      />

      <TicketTransferConfirmationModal
        visible={confirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        ticketCount={selectedTickets.length}
        recipientName={recipientData?.fullName || ""}
        onComplete={handleTransferComplete}
      />
    </SafeAreaView>
  );
}
