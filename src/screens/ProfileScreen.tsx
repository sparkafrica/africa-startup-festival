import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { CloseIcon } from "../components/MenuIcons";

// Industry/Sector options from filter modals
const INDUSTRY_OPTIONS = [
  { id: "technology", label: "Technology" },
  { id: "fintech", label: "Fintech" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "sustainability", label: "Sustainability" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "transportation", label: "Transportation" },
];

// Country options with flags
const COUNTRY_OPTIONS = [
  { id: "nigeria", label: "Nigeria", flag: "🇳🇬" },
  { id: "ghana", label: "Ghana", flag: "🇬🇭" },
  { id: "kenya", label: "Kenya", flag: "🇰🇪" },
  { id: "south-africa", label: "South Africa", flag: "🇿🇦" },
  { id: "egypt", label: "Egypt", flag: "🇪🇬" },
  { id: "tanzania", label: "Tanzania", flag: "🇹🇿" },
  { id: "uganda", label: "Uganda", flag: "🇺🇬" },
  { id: "ethiopia", label: "Ethiopia", flag: "🇪🇹" },
  { id: "morocco", label: "Morocco", flag: "🇲🇦" },
  { id: "algeria", label: "Algeria", flag: "🇩🇿" },
  { id: "tunisia", label: "Tunisia", flag: "🇹🇳" },
  { id: "rwanda", label: "Rwanda", flag: "🇷🇼" },
  { id: "senegal", label: "Senegal", flag: "🇸🇳" },
  { id: "ivory-coast", label: "Ivory Coast", flag: "🇨🇮" },
  { id: "cameroon", label: "Cameroon", flag: "🇨🇲" },
  { id: "zimbabwe", label: "Zimbabwe", flag: "🇿🇼" },
  { id: "angola", label: "Angola", flag: "🇦🇴" },
  { id: "mozambique", label: "Mozambique", flag: "🇲🇿" },
  { id: "zambia", label: "Zambia", flag: "🇿🇲" },
  { id: "malawi", label: "Malawi", flag: "🇲🇼" },
  { id: "united-states", label: "United States", flag: "🇺🇸" },
  { id: "united-kingdom", label: "United Kingdom", flag: "🇬🇧" },
  { id: "canada", label: "Canada", flag: "🇨🇦" },
  { id: "france", label: "France", flag: "🇫🇷" },
  { id: "germany", label: "Germany", flag: "🇩🇪" },
  { id: "italy", label: "Italy", flag: "🇮🇹" },
  { id: "spain", label: "Spain", flag: "🇪🇸" },
  { id: "netherlands", label: "Netherlands", flag: "🇳🇱" },
  { id: "australia", label: "Australia", flag: "🇦🇺" },
  { id: "china", label: "China", flag: "🇨🇳" },
  { id: "india", label: "India", flag: "🇮🇳" },
  { id: "japan", label: "Japan", flag: "🇯🇵" },
  { id: "brazil", label: "Brazil", flag: "🇧🇷" },
  { id: "mexico", label: "Mexico", flag: "🇲🇽" },
  { id: "united-arab-emirates", label: "United Arab Emirates", flag: "🇦🇪" },
  { id: "saudi-arabia", label: "Saudi Arabia", flag: "🇸🇦" },
];

interface IconProps {
  size?: number;
  color?: string;
}

function CameraIcon({ size = 16, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 5.33333C9.10457 5.33333 10 6.22876 10 7.33333C10 8.4379 9.10457 9.33333 8 9.33333C6.89543 9.33333 6 8.4379 6 7.33333C6 6.22876 6.89543 5.33333 8 5.33333Z"
        fill={color}
      />
      <Path
        d="M14 4H11.3333L10.6667 2.66667C10.4899 2.29848 10.1403 2.03333 9.73733 2.03333H6.26267C5.85971 2.03333 5.51008 2.29848 5.33333 2.66667L4.66667 4H2C1.26362 4 0.666667 4.59695 0.666667 5.33333V12C0.666667 12.7364 1.26362 13.3333 2 13.3333H14C14.7364 13.3333 15.3333 12.7364 15.3333 12V5.33333C15.3333 4.59695 14.7364 4 14 4ZM8 11.3333C6.15905 11.3333 4.66667 9.84095 4.66667 8C4.66667 6.15905 6.15905 4.66667 8 4.66667C9.84095 4.66667 11.3333 6.15905 11.3333 8C11.3333 9.84095 9.84095 11.3333 8 11.3333Z"
        fill={color}
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 7.5L10 12.5L15 7.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LinkedInIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18.3333 0H1.66667C0.75 0 0 0.75 0 1.66667V18.3333C0 19.25 0.75 20 1.66667 20H18.3333C19.25 20 20 19.25 20 18.3333V1.66667C20 0.75 19.25 0 18.3333 0ZM6.25 16.6667H3.33333V7.5H6.25V16.6667ZM4.79167 6.04167C3.83333 6.04167 3.125 5.33333 3.125 4.375C3.125 3.41667 3.83333 2.70833 4.79167 2.70833C5.75 2.70833 6.45833 3.41667 6.45833 4.375C6.45833 5.33333 5.75 6.04167 4.79167 6.04167ZM16.6667 16.6667H13.75V12.0833C13.75 10.9167 13.75 9.375 12.0833 9.375C10.4167 9.375 10.2083 10.7083 10.2083 12.0833V16.6667H7.29167V7.5H10.0833V8.95833H10.125C10.5417 8.20833 11.5417 7.41667 13.0417 7.41667C16.125 7.41667 16.6667 9.58333 16.6667 12.7083V16.6667Z"
        fill={color}
      />
    </Svg>
  );
}

function FacebookIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18.3333 0H1.66667C0.75 0 0 0.75 0 1.66667V18.3333C0 19.25 0.75 20 1.66667 20H10V12.5H7.5V9.16667H10V6.66667C10 4.08333 11.5833 2.5 14.1667 2.5C15.3333 2.5 16.25 2.58333 16.6667 2.66667V5.83333H15C13.75 5.83333 13.3333 6.41667 13.3333 7.5V9.16667H16.6667L16.25 12.5H13.3333V20H18.3333C19.25 20 20 19.25 20 18.3333V1.66667C20 0.75 19.25 0 18.3333 0Z"
        fill={color}
      />
    </Svg>
  );
}

function InstagramIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 0C7.28333 0 6.95 0.0166667 5.88333 0.075C4.81667 0.133333 4.08333 0.333333 3.45 0.625C2.78333 0.941667 2.225 1.375 1.66667 1.93333C1.10833 2.49167 0.675 3.05 0.358333 3.71667C0.0666667 4.35 -0.133333 5.08333 -0.075 6.15C-0.0166667 7.21667 0 7.55 0 10.2667C0 12.9833 -0.0166667 13.3167 -0.075 14.3833C-0.133333 15.45 -0.0666667 16.1833 0.358333 16.8167C0.675 17.4833 1.10833 18.0417 1.66667 18.6C2.225 19.1583 2.78333 19.5917 3.45 19.9083C4.08333 20.2 4.81667 20.4 5.88333 20.3417C6.95 20.2833 7.28333 20.2667 10 20.2667C12.7167 20.2667 13.05 20.2833 14.1167 20.3417C15.1833 20.4 15.9167 20.2 16.55 19.9083C17.2167 19.5917 17.775 19.1583 18.3333 18.6C18.8917 18.0417 19.325 17.4833 19.6417 16.8167C19.9333 16.1833 20.1333 15.45 20.075 14.3833C20.0167 13.3167 20.0333 12.9833 20.0333 10.2667C20.0333 7.55 20.0167 7.21667 20.075 6.15C20.1333 5.08333 19.9333 4.35 19.6417 3.71667C19.325 3.05 18.8917 2.49167 18.3333 1.93333C17.775 1.375 17.2167 0.941667 16.55 0.625C15.9167 0.333333 15.1833 0.133333 14.1167 0.075C13.05 0.0166667 12.7167 0 10 0ZM10 1.80833C12.65 1.80833 12.95 1.81667 13.9917 1.875C14.95 1.925 15.5333 2.11667 15.8833 2.26667C16.3833 2.48333 16.75 2.75 17.15 3.15C17.55 3.55 17.8167 3.91667 18.0333 4.41667C18.1833 4.76667 18.375 5.35 18.425 6.30833C18.4833 7.35 18.4917 7.65 18.4917 10.3C18.4917 12.95 18.4833 13.25 18.425 14.2917C18.375 15.25 18.1833 15.8333 18.0333 16.1833C17.8167 16.6833 17.55 17.05 17.15 17.45C16.75 17.85 16.3833 18.1167 15.8833 18.3333C15.5333 18.4833 14.95 18.675 13.9917 18.725C12.95 18.7833 12.65 18.7917 10 18.7917C7.35 18.7917 7.05 18.7833 6.00833 18.725C5.05 18.675 4.46667 18.4833 4.11667 18.3333C3.61667 18.1167 3.25 17.85 2.85 17.45C2.45 17.05 2.18333 16.6833 1.96667 16.1833C1.81667 15.8333 1.625 15.25 1.575 14.2917C1.51667 13.25 1.50833 12.95 1.50833 10.3C1.50833 7.65 1.51667 7.35 1.575 6.30833C1.625 5.35 1.81667 4.76667 1.96667 4.41667C2.18333 3.91667 2.45 3.55 2.85 3.15C3.25 2.75 3.61667 2.48333 4.11667 2.26667C4.46667 2.11667 5.05 1.925 6.00833 1.875C7.05 1.81667 7.35 1.80833 10 1.80833ZM10 4.875C7.58333 4.875 5.625 6.83333 5.625 9.25C5.625 11.6667 7.58333 13.625 10 13.625C12.4167 13.625 14.375 11.6667 14.375 9.25C14.375 6.83333 12.4167 4.875 10 4.875ZM10 12.125C8.55 12.125 7.375 10.95 7.375 9.5C7.375 8.05 8.55 6.875 10 6.875C11.45 6.875 12.625 8.05 12.625 9.5C12.625 10.95 11.45 12.125 10 12.125ZM14.4083 3.49167C13.8083 3.49167 13.325 3.975 13.325 4.575C13.325 5.175 13.8083 5.65833 14.4083 5.65833C15.0083 5.65833 15.4917 5.175 15.4917 4.575C15.4917 3.975 15.0083 3.49167 14.4083 3.49167Z"
        fill={color}
      />
    </Svg>
  );
}

function XIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M18.3333 2.5L11.6667 9.16667L18.3333 15.8333H16.25L10.8333 10.4167L6.25 15H4.16667L10.8333 8.33333L4.16667 2.5H6.25L11.25 7.5L15.4167 2.5H18.3333ZM15.8333 14.1667H17.5L5.83333 3.33333H4.16667L15.8333 14.1667Z"
        fill={color}
      />
    </Svg>
  );
}

function ToggleSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className={`w-12 h-7 rounded-full flex-row items-center px-1 ${
        value ? "bg-green-500" : "bg-neutral-300"
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full bg-white ${
          value ? "ml-auto" : "ml-0"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

function RemoveIcon({ size = 20, color = "#EF4444" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke={color} strokeWidth={1.5} />
      <Path
        d="M7 10H13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfilePictureModal({
  visible,
  onClose,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
}: {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          onPress={(e) => e.stopPropagation()}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Drag Handle */}
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          {/* Modal Content */}
          <View className="px-6 pb-12">
            <Text className="text-[24px] font-bold text-black mb-6 text-center">
              Update Profile Picture
            </Text>

            {/* Profile Picture Preview and Choose Photo */}
            <View className="flex-row items-center mb-6 pb-2">
              <View className="w-24 h-24 rounded-full bg-neutral-200 items-center justify-center mr-4">
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                  />
                  <Path
                    d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View className="flex-1">
                <Pressable
                  onPress={onChoosePhoto}
                  className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 mb-2"
                >
                  <Text className="text-base font-medium text-black text-center">
                    Choose Photo
                  </Text>
                </Pressable>
                <Text className="text-xs text-neutral-500 text-center">
                  Min 400x400px, PNG or JPEG
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3 pb-4">
              <Pressable
                onPress={onTakePhoto}
                className="bg-black rounded-xl py-4 flex-row items-center justify-center"
              >
                <CameraIcon size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold ml-2">
                  Take Photo
                </Text>
              </Pressable>

              <Pressable
                onPress={onRemovePhoto}
                className="bg-white border-2 border-red-500 rounded-xl py-4 flex-row items-center justify-center"
              >
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Circle
                    cx="10"
                    cy="10"
                    r="9"
                    stroke="#EF4444"
                    strokeWidth={2}
                  />
                  <Path
                    d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text className="text-red-500 text-base font-semibold ml-2">
                  Remove Photo
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function IndustryDropdownModal({
  visible,
  onClose,
  selectedIndustry,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selectedIndustry: string;
  onSelect: (industryId: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Drag Handle */}
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
          </View>

          {/* Modal Content */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[24px] font-bold text-black">
                Select Industry/Sector
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
              >
                <CloseIcon size={20} color="#000000" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              className="max-h-[400px]"
            >
              {INDUSTRY_OPTIONS.map((option) => {
                const isSelected = selectedIndustry === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className={`py-4 px-4 rounded-xl mb-2 ${
                      isSelected ? "bg-neutral-200" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        isSelected
                          ? "font-semibold text-black"
                          : "font-medium text-neutral-700"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CountryDropdownModal({
  visible,
  onClose,
  selectedCountry,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selectedCountry: string;
  onSelect: (countryId: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Drag Handle */}
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
          </View>

          {/* Modal Content */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[24px] font-bold text-black">
                Select Country
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
              >
                <CloseIcon size={20} color="#000000" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              className="max-h-[400px]"
            >
              {COUNTRY_OPTIONS.map((option) => {
                const isSelected = selectedCountry === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className={`py-4 px-4 rounded-xl mb-2 flex-row items-center ${
                      isSelected ? "bg-neutral-200" : "bg-white"
                    }`}
                  >
                    <Text className="text-2xl mr-3">{option.flag}</Text>
                    <Text
                      className={`text-base flex-1 ${
                        isSelected
                          ? "font-semibold text-black"
                          : "font-medium text-neutral-700"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
      <Text className="text-[28px] font-inter-semibold text-black">Manage Profile</Text>
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

function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: "Personal" | "Company";
  onTabChange: (tab: "Personal" | "Company") => void;
}) {
  return (
    <View className="px-6 pb-4">
      <View className="flex-row bg-neutral-100 rounded-2xl p-1">
        <Pressable
          onPress={() => onTabChange("Personal")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "Personal" ? "bg-white rounded-xl" : "bg-transparent"
          }`}
          style={
            activeTab === "Personal"
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
              activeTab === "Personal" ? "text-black" : "text-neutral-500"
            }`}
          >
            Personal
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange("Company")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "Company" ? "bg-white rounded-xl" : "bg-transparent"
          }`}
          style={
            activeTab === "Company"
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
              activeTab === "Company" ? "text-black" : "text-neutral-500"
            }`}
          >
            Company
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PersonalProfileSection() {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [bio, setBio] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "AI/ML",
    "SaaS",
    "Product Strategy",
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const selectedIndustryLabel =
    INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
    "Technology";
  const selectedCountryData =
    COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry) ||
    COUNTRY_OPTIONS[0];

  const interests = [
    "AI/ML",
    "SaaS",
    "Product Strategy",
    "E-commerce",
    "Fintech",
    "Developer Tools",
    "Infrastructure",
    "Growth Marketing",
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 12) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="px-4">
          {/* Profile Picture and Name Section */}
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 mb-6 p-2">
            <View className="flex-row items-center mb-4">
              <View className="relative">
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center">
                  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                    />
                    <Path
                      d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Pressable
                  className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full items-center justify-center border-2 border-white"
                  onPress={() => setShowProfileModal(true)}
                >
                  <CameraIcon size={12} color="#FFFFFF" />
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[18px] font-bold text-black">
                  John Doe
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">
                  John.doe@email.com
                </Text>
              </View>
            </View>

            {/* Email Warning */}
            <View
              className="rounded-xl p-3"
              style={{
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text className="text-sm text-neutral-700">
                Email cannot be changed as it's linked to your ticket.{" "}
                <Text className="underline">Contact support</Text> if needed.
              </Text>
            </View>
          </View>

          {/* Personal Information Section */}
          <View className="rounded-2xl border border-neutral-200  mb-6 px-2">
            {/* Full Name */}
            <View className="mb-4 pt-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />
            </View>

            {/* Job Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Job Title
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Enter job title"
              />
            </View>

            {/* Company */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Company
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={company}
                onChangeText={setCompany}
                placeholder="Enter company name"
              />
            </View>

            {/* LinkedIn */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                LinkedIn
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                  value={linkedIn}
                  onChangeText={setLinkedIn}
                  placeholder="Insert profile link"
                />
                <Pressable className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3">
                  <Text className="text-sm font-medium text-black">
                    Paste link
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Country */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Country
              </Text>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-black">
                    {selectedCountryData.label}
                  </Text>
                </View>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Industry/Sector */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Industry/Sector
              </Text>
              <Pressable
                onPress={() => setShowIndustryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-black">
                  {selectedIndustryLabel}
                </Text>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Bio
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black min-h-[100px]"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
                />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1">
                  <Text className="text-xs text-neutral-500">
                    {bio.length}/200
                  </Text>
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path
                      d="M1 11L11 1M11 1H1M11 1V11"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </View>
          </View>

          {/* Top Interests */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <Text className="text-sm font-medium text-neutral-700 mb-1">
              Top Interests
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              Select 5-12 sectors you want to connect with
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full ${
                      isSelected
                        ? "bg-black"
                        : "bg-neutral-100 border border-neutral-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-black"
                      }`}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <ProfilePictureModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onTakePhoto={() => {
          console.log("Take Photo");
          setShowProfileModal(false);
        }}
        onChoosePhoto={() => {
          console.log("Choose Photo");
          setShowProfileModal(false);
        }}
        onRemovePhoto={() => {
          console.log("Remove Photo");
          setShowProfileModal(false);
        }}
      />
      <IndustryDropdownModal
        visible={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        selectedIndustry={selectedIndustry}
        onSelect={setSelectedIndustry}
      />
      <CountryDropdownModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCountry={selectedCountry}
        onSelect={setSelectedCountry}
      />
    </KeyboardAvoidingView>
  );
}

function AttendeeProfileSection() {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "AI/ML",
    "SaaS",
    "Product Strategy",
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const selectedIndustryLabel =
    INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
    "Technology";
  const selectedCountryData =
    COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry) ||
    COUNTRY_OPTIONS[0];

  const interests = [
    "AI/ML",
    "SaaS",
    "Product Strategy",
    "E-commerce",
    "Fintech",
    "Developer Tools",
    "Infrastructure",
    "Growth Marketing",
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 12) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="px-4">
          {/* Profile Picture and Name Section */}
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 mb-6 p-2">
            <View className="flex-row items-center mb-4">
              <View className="relative">
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center">
                  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                    />
                    <Path
                      d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Pressable
                  className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full items-center justify-center border-2 border-white"
                  onPress={() => setShowProfileModal(true)}
                >
                  <CameraIcon size={12} color="#FFFFFF" />
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[18px] font-bold text-black">
                  John Doe
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">
                  John.doe@email.com
                </Text>
              </View>
            </View>

            {/* Email Warning */}
            <View
              className="rounded-xl p-3"
              style={{
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text className="text-sm text-neutral-700">
                Email cannot be changed as it's linked to your ticket.{" "}
                <Text className="underline">Contact support</Text> if needed.
              </Text>
            </View>
          </View>

          {/* Personal Information Section */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            {/* Full Name */}
            <View className="mb-4 pt-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />
            </View>

            {/* Job Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Job Title
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Enter job title"
              />
            </View>

            {/* Company */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Company
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={company}
                onChangeText={setCompany}
                placeholder="Enter company name"
              />
            </View>

            {/* Country */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Country
              </Text>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-black">
                    {selectedCountryData.label}
                  </Text>
                </View>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Industry/Sector */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Industry/Sector
              </Text>
              <Pressable
                onPress={() => setShowIndustryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-black">
                  {selectedIndustryLabel}
                </Text>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Bio
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black min-h-[100px]"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
                />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1">
                  <Text className="text-xs text-neutral-500">
                    {bio.length}/200
                  </Text>
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path
                      d="M1 11L11 1M11 1H1M11 1V11"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </View>
          </View>

          {/* Top Interests */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <Text className="text-sm font-medium text-neutral-700 mb-1">
              Top Interests
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              Select 5-12 sectors you want to connect with
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full ${
                      isSelected
                        ? "bg-black"
                        : "bg-neutral-100 border border-neutral-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-black"
                      }`}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <ProfilePictureModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onTakePhoto={() => {
          console.log("Take Photo");
          setShowProfileModal(false);
        }}
        onChoosePhoto={() => {
          console.log("Choose Photo");
          setShowProfileModal(false);
        }}
        onRemovePhoto={() => {
          console.log("Remove Photo");
          setShowProfileModal(false);
        }}
      />
      <IndustryDropdownModal
        visible={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        selectedIndustry={selectedIndustry}
        onSelect={setSelectedIndustry}
      />
      <CountryDropdownModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCountry={selectedCountry}
        onSelect={setSelectedCountry}
      />
    </KeyboardAvoidingView>
  );
}

function CompanyProfileSection() {
  const [companyName, setCompanyName] = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [offers, setOffers] = useState<Array<{ title: string; color: string }>>(
    []
  );
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferColor, setNewOfferColor] = useState<string | undefined>(
    undefined
  );
  const [linkedIn, setLinkedIn] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newJobRole, setNewJobRole] = useState("");
  const [newJobLink, setNewJobLink] = useState("");
  const [positions, setPositions] = useState<string[]>([
    "Chief Operating Officer",
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const selectedIndustryLabel =
    INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
    "Technology";
  const selectedCountryData =
    COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry) ||
    COUNTRY_OPTIONS[0];

  const addOffer = () => {
    if (newOfferTitle.trim()) {
      // Use selected color or default to green if none selected
      const offerColor = newOfferColor || "#4CAF50";
      setOffers([...offers, { title: newOfferTitle, color: offerColor }]);
      setNewOfferTitle("");
      setNewOfferColor(undefined);
      setShowAddOffer(false);
    }
  };

  const removeOffer = (offer: { title: string; color: string }) => {
    setOffers(offers.filter((o) => o.title !== offer.title));
  };

  const addPosition = () => {
    if (newJobRole.trim()) {
      setPositions([...positions, newJobRole]);
      setNewJobRole("");
      setNewJobLink("");
      setShowAddPosition(false);
    }
  };

  const removePosition = (position: string) => {
    setPositions(positions.filter((p) => p !== position));
  };

  // Removed getOfferColor - now using color from offer object directly

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="px-4">
          {/* Company Picture and Name Section */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            <View className="flex-row items-center mb-4 pt-3">
              <View className="relative">
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center">
                  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                    />
                    <Path
                      d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Pressable
                  className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full items-center justify-center border-2 border-white"
                  onPress={() => setShowProfileModal(true)}
                >
                  <CameraIcon size={12} color="#FFFFFF" />
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[18px] font-bold text-black">
                  TechCorp Inc
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">Booth 24</Text>
              </View>
            </View>

            {/* Email Warning */}
            <View
              className="rounded-xl p-3 mb-6"
              style={{
                backgroundColor: "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text className="text-sm text-neutral-700">
                Email cannot be changed as it's linked to your ticket.{" "}
                <Text className="underline">Contact support</Text> if needed.
              </Text>
            </View>
          </View>

          {/* Company Information Section */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            {/* Company Name */}
            <View className="mb-4 pt-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Company Name
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Enter company name"
              />
            </View>

            {/* Booth Number */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Booth Number
              </Text>
              <TextInput
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                value={boothNumber}
                onChangeText={setBoothNumber}
                placeholder="Enter booth number"
              />
            </View>

            {/* Website */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Website
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="Enter website URL"
                />
                <Pressable className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3">
                  <Text className="text-sm font-medium text-black">
                    Paste link
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Industry/Sector */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Industry/Sector
              </Text>
              <Pressable
                onPress={() => setShowIndustryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-black">
                  {selectedIndustryLabel}
                </Text>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Country */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Country
              </Text>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-black">
                    {selectedCountryData.label}
                  </Text>
                </View>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Company Description */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Company Description
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-gray-500 min-h-[100px]"
                  value={companyDescription}
                  onChangeText={setCompanyDescription}
                  placeholder="Describe your company"
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
                />
                <View className="absolute bottom-3 right-3 flex-row items-center gap-1">
                  <Text className="text-xs text-neutral-500">
                    {companyDescription.length}/200
                  </Text>
                  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <Path
                      d="M1 11L11 1M11 1H1M11 1V11"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </View>
          </View>

          {/* Event Offers */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            <View className="flex-row items-center justify-between mb-3 pt-4">
              <Text className="text-[14px] font-semibold text-neutral-700">
                Event Offers
              </Text>
              <Pressable
                onPress={() => setShowAddOffer(!showAddOffer)}
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-1.5"
              >
                <Text className="text-sm font-medium text-black">
                  + Add Offer
                </Text>
              </Pressable>
            </View>

            {showAddOffer && (
              <View className="mb-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black mb-3"
                  value={newOfferTitle}
                  onChangeText={setNewOfferTitle}
                  placeholder="Offer title (e.g., Free Consultation)"
                />

                {/* Offer color picker (ROYGBIV) */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-neutral-700 mb-2">
                    Select Color
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {/* Color palette */}
                    {[
                      { name: "Red", val: "#F44336" },
                      { name: "Orange", val: "#FF9800" },
                      { name: "Yellow", val: "#FFEB3B" },
                      { name: "Green", val: "#4CAF50" },
                      { name: "Blue", val: "#2196F3" },
                      { name: "Indigo", val: "#3F51B5" },
                      { name: "Violet", val: "#9C27B0" },
                    ].map((colorOption) => (
                      <Pressable
                        key={colorOption.name}
                        onPress={() => setNewOfferColor(colorOption.val)}
                        className={`w-7 h-7 rounded-full items-center justify-center border ${
                          newOfferColor === colorOption.val
                            ? "border-black"
                            : "border-white"
                        }`}
                        style={{ backgroundColor: colorOption.val }}
                        accessibilityLabel={colorOption.name}
                      >
                        {newOfferColor === colorOption.val && (
                          <Svg
                            width={14}
                            height={14}
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <Path
                              d="M3 7.5L6 10L11 4"
                              stroke="#fff"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={addOffer}
                    className="flex-1 bg-black rounded-xl py-3 items-center"
                  >
                    <Text className="text-white text-sm font-medium">Add</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowAddOffer(false);
                      setNewOfferTitle("");
                      setNewOfferColor(undefined);
                    }}
                    className="flex-1 bg-white border border-neutral-300 rounded-xl py-3 items-center"
                  >
                    <Text className="text-black text-sm font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Event Offers List */}
            <View className="flex-row flex-wrap gap-2 pb-4">
              {offers.map((offer, index) => (
                <View
                  key={`${offer.title}-${index}`}
                  className="flex-row items-center px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: offer.color || "#4CAF50",
                  }}
                >
                  <Text className="text-sm font-medium text-white mr-2">
                    {offer.title}
                  </Text>
                  <Pressable onPress={() => removeOffer(offer)}>
                    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="white"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Social Links */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            <View className=" p-2">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-3">
                Social Links
              </Text>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <LinkedInIcon size={22} color="#404040" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-2 text-base text-black"
                    value={linkedIn}
                    onChangeText={setLinkedIn}
                    placeholder="LinkedIn handle"
                    style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                  />
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <FacebookIcon size={22} color="#404040" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-2 text-base text-black"
                    value={facebook}
                    onChangeText={setFacebook}
                    placeholder="Facebook handle"
                    style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                  />
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <InstagramIcon size={22} color="#404040" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-2 text-base text-black"
                    value={instagram}
                    onChangeText={setInstagram}
                    placeholder="Instagram handle"
                    style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                  />
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <XIcon size={22} color="#404040" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-2 text-base text-black"
                    value={xHandle}
                    onChangeText={setXHandle}
                    placeholder="X handle"
                    style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Recruiting */}
          <View className="rounded-2xl border border-neutral-200 mb-6 p-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-neutral-700">
                Recruiting
              </Text>
              <ToggleSwitch
                value={isRecruiting}
                onValueChange={setIsRecruiting}
              />
            </View>

            {isRecruiting && (
              <>
                {showAddPosition && (
                  <View className="mb-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <TextInput
                      className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black mb-3"
                      value={newJobRole}
                      onChangeText={setNewJobRole}
                      placeholder="Job Role"
                    />
                    <View className="flex-row items-center gap-2 mb-3">
                      <TextInput
                        className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black"
                        value={newJobLink}
                        onChangeText={setNewJobLink}
                        placeholder="Job Link"
                      />
                      <Pressable className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3">
                        <Text className="text-sm font-medium text-black">
                          Paste link
                        </Text>
                      </Pressable>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={addPosition}
                        className="flex-1 bg-black rounded-xl py-3 items-center"
                      >
                        <Text className="text-white text-sm font-medium">
                          Add Position
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setShowAddPosition(false);
                          setNewJobRole("");
                          setNewJobLink("");
                        }}
                        className="flex-1 bg-white border border-neutral-300 rounded-xl py-3 items-center"
                      >
                        <Text className="text-black text-sm font-medium">
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {!showAddPosition && (
                  <Pressable
                    onPress={() => setShowAddPosition(true)}
                    className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 mb-3"
                  >
                    <Text className="text-sm font-medium text-black text-center">
                      + Add Position
                    </Text>
                  </Pressable>
                )}

                <View className="flex-row flex-wrap gap-2">
                  {positions.map((position) => (
                    <View
                      key={position}
                      className="flex-row items-center px-4 py-2 rounded-full bg-white border border-neutral-300"
                    >
                      <Text className="text-sm font-medium text-black mr-2">
                        {position}
                      </Text>
                      <Pressable onPress={() => removePosition(position)}>
                        <Svg
                          width={14}
                          height={14}
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <Path
                            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                            stroke="#404040"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <ProfilePictureModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onTakePhoto={() => {
          console.log("Take Photo");
          setShowProfileModal(false);
        }}
        onChoosePhoto={() => {
          console.log("Choose Photo");
          setShowProfileModal(false);
        }}
        onRemovePhoto={() => {
          console.log("Remove Photo");
          setShowProfileModal(false);
        }}
      />
      <IndustryDropdownModal
        visible={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        selectedIndustry={selectedIndustry}
        onSelect={setSelectedIndustry}
      />
      <CountryDropdownModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        selectedCountry={selectedCountry}
        onSelect={setSelectedCountry}
      />
    </KeyboardAvoidingView>
  );
}

export default function ProfileScreen() {
  // TODO: Connect this to backend to determine user role
  // For now, defaulting to "attendee" - backend will handle role-based access
  const [userRole] = useState<"attendee" | "company">("attendee");
  const [activeTab, setActiveTab] = useState<"Personal" | "Company">(
    "Personal"
  );
  const { completeProfile } = useAuth();

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Header />
        {userRole === "attendee" ? (
          <>
            <AttendeeProfileSection />
            {/* Save Changes Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pb-10 pt-4">
              <Pressable
                className="bg-black rounded-xl py-4 items-center justify-center"
                onPress={async () => {
                  // TODO: Save profile data to backend
                  // For now, just complete the profile to proceed to main app
                  await completeProfile();
                }}
              >
                <Text className="text-white text-base font-inter-semibold">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <SegmentedControl
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab === "Personal" ? (
              <PersonalProfileSection />
            ) : (
              <CompanyProfileSection />
            )}
            {/* Save Changes Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pb-10 pt-4">
              <Pressable
                className="bg-black rounded-xl py-4 items-center justify-center"
                onPress={async () => {
                  // TODO: Save profile data to backend
                  // For now, just complete the profile to proceed to main app
                  await completeProfile();
                }}
              >
                <Text className="text-white text-base font-semibold">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
