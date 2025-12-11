import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { ScrollView } from "react-native";

interface IconProps {
  size?: number;
  color?: string;
}

function CloseIcon({ size = 24, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-4 pt-6 pb-4">
      <Text className="text-[24px] font-semibold text-black">Scan QR Code</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-10 h-10 items-center justify-center"
        hitSlop={10}
      >
        <CloseIcon size={20} color="#000000" />
      </Pressable>
    </View>
  );
}

function TicketIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 6C2 4.89543 2.89543 4 4 4H16C17.1046 4 18 4.89543 18 6V8C16.8954 8 16 8.89543 16 10C16 11.1046 16.8954 12 18 12V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V12C3.10457 12 4 11.1046 4 10C4 8.89543 3.10457 8 2 8V6Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QRIconSmall({ size = 16, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2" y="2" width="4" height="4" fill={color} />
      <Rect x="10" y="2" width="2" height="2" fill={color} />
      <Rect x="14" y="2" width="2" height="2" fill={color} />
      <Rect x="2" y="10" width="2" height="2" fill={color} />
      <Rect x="6" y="10" width="2" height="2" fill={color} />
      <Rect x="10" y="10" width="4" height="4" fill={color} />
      <Rect x="2" y="14" width="2" height="2" fill={color} />
      <Rect x="6" y="14" width="2" height="2" fill={color} />
      <Rect x="14" y="12" width="2" height="2" fill={color} />
      <Rect x="2" y="6" width="2" height="2" fill={color} />
    </Svg>
  );
}

function ThreeDotsIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="5" r="1.5" fill={color} />
      <Circle cx="10" cy="10" r="1.5" fill={color} />
      <Circle cx="10" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: "My Ticket" | "Scan Ticket";
  onTabChange: (tab: "My Ticket" | "Scan Ticket") => void;
}) {
  return (
    <View className="px-4 pb-2">
      <View className="flex-row bg-neutral-100 rounded-2xl p-1">
        <Pressable
          onPress={() => onTabChange("My Ticket")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "My Ticket" ? "bg-white rounded-xl" : "bg-transparent"
          }`}
          style={
            activeTab === "My Ticket"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-sm font-medium text-center ${
              activeTab === "My Ticket" ? "text-black" : "text-neutral-500"
            }`}
          >
            My Ticket
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange("Scan Ticket")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "Scan Ticket"
              ? "bg-white rounded-xl"
              : "bg-transparent"
          }`}
          style={
            activeTab === "Scan Ticket"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-sm font-medium text-center ${
              activeTab === "Scan Ticket" ? "text-black" : "text-neutral-500"
            }`}
          >
            Scan Ticket
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScanFrame() {
  const frameSize = 300;
  const cornerLength = 35;
  const cornerWidth = 4;

  return (
    <View className="items-center justify-center m-12 pt-5">
      <View
        className="relative items-center justify-center"
        style={{ width: frameSize, height: frameSize }}
      >
        <View
          className="absolute rounded-2xl"
          style={{ width: frameSize, height: frameSize }}
        />
        <View className="p-4 rounded-xl border border-neutral-200">
          <Image
            source={require("../assets/images/qr-code.png")}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        </View>
        <View
          className="absolute"
          style={{
            width: frameSize,
            height: frameSize,
            top: 0,
            left: 0,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderTopLeftRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderTopLeftRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderTopRightRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderTopRightRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderBottomLeftRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderBottomLeftRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderBottomRightRadius: 26,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderBottomRightRadius: 26,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function Instructions() {
  return (
    <View className="items-center px-4 pb-8 pt-4">
      <Text className="text-[22px] font-bold text-black mb-2 text-center">
        Scan Attendee Tickets
      </Text>
      <Text className="text-sm text-neutral-600 text-center leading-5">
        Point your camera at an attendee ticket to instantly view their profile
        and send a connection request.
      </Text>
    </View>
  );
}

function ManualEntryButton() {
  return (
    <View className="px-4 pb-4">
      <View className="items-center">
        <Pressable
          onPress={() => console.log("Enter code manually")}
          className="py-4 items-center justify-center bg-neutral-100 rounded-2xl w-[60%] border border-neutral-300"
        >
          <Text className="text-base font-medium text-black">
            Enter Code Manually
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function TicketCard({
  title,
  ticketNumber,
  backgroundColor,
  assignedTo,
  isUnassigned,
  onViewQR,
  onTransfer,
  onAssign,
}: {
  title: string;
  ticketNumber: string;
  backgroundColor: string;
  assignedTo?: string;
  isUnassigned?: boolean;
  onViewQR?: () => void;
  onTransfer?: () => void;
  onAssign?: () => void;
}) {
  return (
    <View className="mb-4">
      <View
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ backgroundColor }}
      >
        <View className="absolute top-0 right-0 w-24 h-24 opacity-20">
          <View className="absolute top-3 right-3 w-10 h-10 border-2 border-white/30 rounded-lg" />
          <View className="absolute top-8 right-8 w-5 h-5 border-2 border-white/30 rounded" />
          <View className="absolute top-14 right-14 w-3 h-3 border border-white/30 rounded" />
        </View>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-white text-2xl font-bold mb-2">{title}</Text>
            <Text className="text-white/50 text-base mb-10">
              {ticketNumber}
            </Text>
            {assignedTo && (
              <View className="flex-col">
                <Text className="text-white/60 text-sm">Assigned to</Text>
                <Text className="text-white text-[18px] font-semibold py-2">
                  {assignedTo}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            {isUnassigned && (
              <View className="bg-white/20 px-2 py-1 rounded-full flex-row items-center">
                <View className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                <Text className="text-white text-xs font-medium">
                  Unassigned
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <View className="w-6 h-6 items-center justify-center">
                <TicketIcon size={18} color="#FFFFFF" />
              </View>
              {!isUnassigned && (
                <Pressable className="w-6 h-6 items-center justify-center">
                  <ThreeDotsIcon size={18} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
      {/* Assigned to buttons - View QR Code / Transfer Ticket */}
      {assignedTo && (
        <View className="mt-8 gap-3 pr-4 pt-4">
          <Pressable
            onPress={onViewQR}
            className="flex-row items-center justify-center bg-neutral-100 rounded-xl py-3.5 px-4 border border-neutral-300"
            style={{ width: "100%" }}
          >
            <QRIconSmall size={16} color="#404040" />
            <Text className="text-sm font-medium text-black ml-2">
              View QR Code
            </Text>
          </Pressable>
          <Pressable
            onPress={onTransfer}
            className="items-center justify-center bg-white rounded-xl py-3.5 px-4 border border-red-500"
            style={{ width: "100%" }}
          >
            <Text className="text-sm font-medium text-red-500">
              Transfer This Ticket
            </Text>
          </Pressable>
        </View>
      )}
      {/* Available to assign buttons - Assign / Transfer Ticket */}
      {isUnassigned && (
        <Pressable
          onPress={onAssign}
          className="mt-3 flex-row items-center justify-center bg-neutral-200 rounded-xl py-4 px-4 border border-neutral-300"
        >
          <Text className="text-sm font-medium text-black">
            Assign / Transfer Ticket
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function MyTicketView() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-[20px] font-semibold text-black mb-4">
          My Tickets
        </Text>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 10,
            overflow: "hidden",
            marginBottom: 16, // space between cards if you want
          }}
        >
          <TicketCard
            title="Founder Pass"
            ticketNumber="#SPK2025-1234"
            backgroundColor="#000000"
            assignedTo="John Doe"
            onViewQR={() => console.log("View QR Code")}
            onTransfer={() => console.log("Transfer Ticket")}
          />
        </View>

        <Text className="text-[20px] font-semibold text-black mb-4 mt-6">
          Available to Assign
        </Text>
        <View
          style={{
            marginHorizontal: 4,
            paddingHorizontal: 6,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 10,
              overflow: "hidden",
              marginBottom: 16, // space between cards
            }}
          >
            <TicketCard
              title="Exhibitor Pass"
              ticketNumber="#SPK2025-5678"
              backgroundColor="#10B981"
              isUnassigned
              onAssign={() => console.log("Assign Ticket")}
            />
          </View>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 10,
              overflow: "hidden",
              marginBottom: 0,
            }}
          >
            <TicketCard
              title="Attendee Pass"
              ticketNumber="#SPK2025-9012"
              backgroundColor="#3B82F6"
              isUnassigned
              onAssign={() => console.log("Assign Ticket")}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function ScanQRScreen() {
  const [activeTab, setActiveTab] = useState<"My Ticket" | "Scan Ticket">(
    "Scan Ticket"
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <StatusBar style="dark" />
        <Header />
        <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "My Ticket" ? (
          <MyTicketView />
        ) : (
          <>
            <ScanFrame />
            <Instructions />
            <ManualEntryButton />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
