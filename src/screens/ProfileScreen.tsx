import React, { useState, useRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { companyService } from "../services/companyService";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { CloseIcon } from "../components/MenuIcons";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

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

// Validation Helper Functions
const validateFullName = (name: string): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: "Full name is required" };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: "Full name must be at least 2 characters" };
  }
  if (name.trim().length > 100) {
    return {
      valid: false,
      error: "Full name must be less than 100 characters",
    };
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return {
      valid: false,
      error:
        "Full name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }
  return { valid: true };
};

const validateJobTitle = (
  title: string
): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: "Job title is required" };
  }
  if (title.trim().length < 2) {
    return { valid: false, error: "Job title must be at least 2 characters" };
  }
  if (title.trim().length > 100) {
    return {
      valid: false,
      error: "Job title must be less than 100 characters",
    };
  }
  return { valid: true };
};

const validateCompany = (
  company: string
): { valid: boolean; error?: string } => {
  if (!company.trim()) {
    return { valid: false, error: "Company name is required" };
  }
  if (company.trim().length < 2) {
    return {
      valid: false,
      error: "Company name must be at least 2 characters",
    };
  }
  if (company.trim().length > 200) {
    return {
      valid: false,
      error: "Company name must be less than 200 characters",
    };
  }
  return { valid: true };
};

const validateLinkedIn = (
  linkedIn: string
): { valid: boolean; error?: string } => {
  if (!linkedIn.trim()) {
    return { valid: false, error: "LinkedIn profile is required" };
  }
  // Allow both URLs and handles
  const linkedInUrlPattern =
    /^(https?:\/\/)?(www\.)?(linkedin\.com\/in\/|linkedin\.com\/pub\/)[a-zA-Z0-9-]+\/?/i;
  const linkedInHandlePattern = /^[a-zA-Z0-9-]+$/;

  if (
    !linkedInUrlPattern.test(linkedIn.trim()) &&
    !linkedInHandlePattern.test(linkedIn.trim())
  ) {
    return {
      valid: false,
      error: "Please enter a valid LinkedIn profile URL or handle",
    };
  }
  return { valid: true };
};

const validateBio = (bio: string): { valid: boolean; error?: string } => {
  if (!bio.trim()) {
    return { valid: false, error: "Bio is required" };
  }
  if (bio.trim().length < 10) {
    return { valid: false, error: "Bio must be at least 10 characters" };
  }
  if (bio.length > 200) {
    return { valid: false, error: "Bio must be less than 200 characters" };
  }
  return { valid: true };
};

const validateWebsite = (
  website: string
): { valid: boolean; error?: string } => {
  if (!website.trim()) {
    return { valid: false, error: "Website is required" };
  }
  // Allow URLs with or without protocol
  const websitePattern =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/.*)?$/i;

  if (!websitePattern.test(website.trim())) {
    return { valid: false, error: "Please enter a valid website URL" };
  }
  return { valid: true };
};

const validateBoothNumber = (
  booth: string
): { valid: boolean; error?: string } => {
  if (!booth.trim()) {
    return { valid: false, error: "Booth number is required" };
  }
  if (booth.trim().length > 50) {
    return {
      valid: false,
      error: "Booth number must be less than 50 characters",
    };
  }
  return { valid: true };
};

const validateCompanyDescription = (
  description: string
): { valid: boolean; error?: string } => {
  if (!description.trim()) {
    return { valid: false, error: "Company description is required" };
  }
  if (description.trim().length < 10) {
    return {
      valid: false,
      error: "Company description must be at least 10 characters",
    };
  }
  if (description.length > 200) {
    return {
      valid: false,
      error: "Company description must be less than 200 characters",
    };
  }
  return { valid: true };
};

const validateInterests = (
  interests: string[]
): { valid: boolean; error?: string } => {
  if (interests.length < 2) {
    return { valid: false, error: "Please select at least 2 interests" };
  }
  if (interests.length > 5) {
    return { valid: false, error: "Please select no more than 5 interests" };
  }
  return { valid: true };
};

const validateSocialHandle = (
  handle: string,
  platform: string
): { valid: boolean; error?: string } => {
  // Social handles are optional, but if provided must be valid format
  if (!handle.trim()) {
    return { valid: true }; // Empty is allowed
  }
  // Basic validation for social media handles (alphanumeric, underscores, dots, hyphens)
  const handlePattern = /^[a-zA-Z0-9._-]+$/;

  if (!handlePattern.test(handle.trim())) {
    return { valid: false, error: `Please enter a valid ${platform} handle` };
  }
  return { valid: true };
};

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

  const handleClose = () => {
    // Check if we can go back before attempting navigation
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If we can't go back (e.g., after profile update changes navigation state),
      // navigate to Home screen instead
      navigation.navigate("Home");
    }
  };

  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
      <Text className="text-[28px] font-inter-semibold text-black">
        Manage Profile
      </Text>
      <Pressable
        onPress={handleClose}
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

function PersonalProfileSection({
  onSave,
  saveTrigger,
}: {
  onSave?: () => void;
  saveTrigger?: number;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [bio, setBio] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [shouldRemovePhoto, setShouldRemovePhoto] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Get current profile picture from user
  const currentProfilePic = user?.profile_pic || null;
  // Show selected image if available, otherwise show current or null
  const displayImageUri = shouldRemovePhoto
    ? null
    : selectedImageUri || currentProfilePic;

  const dataLoadedRef = React.useRef(false);

  // Load user data into form fields (only on initial mount to prevent overwriting user edits)
  React.useEffect(() => {
    if (user && !dataLoadedRef.current) {
      // Set full name
      if (user.first_name || user.last_name) {
        setFullName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
      }

      // Set job title
      if (user.job_title) {
        setJobTitle(user.job_title);
      }

      // Set bio
      if (user.bio) {
        setBio(user.bio);
      }

      // Set country - find matching ID from label
      if (user.country) {
        const countryOption = COUNTRY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === user.country?.toLowerCase()
        );
        if (countryOption) {
          setSelectedCountry(countryOption.id);
        }
      }

      // Parse metadata (might be string or object)
      let metadata = user.metadata;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing metadata:", e);
          metadata = {};
        }
      }

      // Set LinkedIn from metadata
      if (metadata?.linkedIn) {
        setLinkedIn(metadata.linkedIn);
      }

      // Set industry from metadata - find matching ID from label
      if (metadata?.industry) {
        const industryOption = INDUSTRY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === metadata.industry.toLowerCase()
        );
        if (industryOption) {
          setSelectedIndustry(industryOption.id);
        }
      }

      // Set interests from metadata
      if (metadata?.interests && Array.isArray(metadata.interests)) {
        setSelectedInterests(metadata.interests);
      }

      // Set company name from user.company
      if (user?.company?.name) {
        setCompany(user.company.name);
      }

      // Clear validation errors when data loads
      setValidationErrors({});

      dataLoadedRef.current = true;
    }
  }, [user]);

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
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  // Image Picker Handlers
  const handleTakePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false); // Clear removal flag if user selects new image
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showToast("Failed to take photo. Please try again.", "error");
    }
  };

  const handleChoosePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select photos."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false); // Clear removal flag if user selects new image
      }
    } catch (error) {
      console.error("Error choosing photo:", error);
      showToast("Failed to select photo. Please try again.", "error");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setShowProfileModal(false);
      setSelectedImageUri(null);
      setShouldRemovePhoto(true);
      // Note: Actual removal happens on save
    } catch (error) {
      console.error("Error removing photo:", error);
      showToast("Failed to remove photo. Please try again.", "error");
    }
  };

  // TODO: BACKEND INTEGRATION - Save profile data to backend API
  // API Endpoint: PUT /api/user/profile/personal
  // Request Body: { fullName, jobTitle, company, linkedIn, bio, interests, tags, ... }
  // Response: { success: boolean, profile: Profile }
  // TODO: BACKEND - Handle validation errors from backend
  // TODO: BACKEND - Show loading state during API call
  // TODO: BACKEND - Handle API errors and show error messages
  const handleSave = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.valid) {
      errors.fullName = fullNameValidation.error || "";
    }

    const jobTitleValidation = validateJobTitle(jobTitle);
    if (!jobTitleValidation.valid) {
      errors.jobTitle = jobTitleValidation.error || "";
    }

    const companyValidation = validateCompany(company);
    if (!companyValidation.valid) {
      errors.company = companyValidation.error || "";
    }

    const linkedInValidation = validateLinkedIn(linkedIn);
    if (!linkedInValidation.valid) {
      errors.linkedIn = linkedInValidation.error || "";
    }

    const bioValidation = validateBio(bio);
    if (!bioValidation.valid) {
      errors.bio = bioValidation.error || "";
    }

    const interestsValidation = validateInterests(selectedInterests);
    if (!interestsValidation.valid) {
      errors.interests = interestsValidation.error || "";
    }

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return false;
    }

    try {
      // Handle profile picture upload or removal
      if (shouldRemovePhoto) {
        // Remove profile picture
        setIsUploadingImage(true);
        try {
          await authService.removeProfilePicture();
          setShouldRemovePhoto(false);
        } catch (imageError: any) {
          console.error("Error removing profile picture:", imageError);
          showToast(
            imageError.message || "Failed to remove profile picture.",
            "error"
          );
          setIsUploadingImage(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (selectedImageUri) {
        // Upload new profile picture
        setIsUploadingImage(true);
        try {
          await authService.uploadProfilePicture(selectedImageUri);
          setSelectedImageUri(null); // Clear selected image after successful upload
          setShouldRemovePhoto(false); // Clear removal flag if it was set
        } catch (imageError: any) {
          console.error("Error uploading profile picture:", imageError);
          showToast(
            imageError.message || "Failed to upload profile picture.",
            "error"
          );
          setIsUploadingImage(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Split fullName into first_name and last_name
      const nameParts = fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      // Get selected industry label
      const industryLabel =
        INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
        "";

      // Get selected country label
      const countryLabel =
        COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry)?.label || "";

      // Build metadata object for fields that don't have direct backend fields
      const metadata: any = {};
      if (industryLabel) {
        metadata.industry = industryLabel;
      }
      if (selectedInterests.length > 0) {
        metadata.interests = selectedInterests;
      }
      if (linkedIn.trim()) {
        metadata.linkedIn = linkedIn.trim();
      }

      // Prepare API request payload
      const profileData: any = {
        first_name,
        last_name,
        job_title: jobTitle.trim(),
        bio: bio.trim() || null,
        country: countryLabel,
      };

      // Only include metadata if it has content
      if (Object.keys(metadata).length > 0) {
        profileData.metadata = metadata;
      }

      // Save profile data to backend API
      await authService.updateProfile(profileData);

      // Show success toast
      showToast("Profile saved successfully!", "success");

      // Call onSave callback if provided (this refreshes user data)
      if (onSave) {
        await onSave();
      }
      return true;
    } catch (error: any) {
      console.error("Error saving profile:", error);

      // Handle backend validation errors
      if (error.responseCode === 400 && error.data) {
        const backendErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((field) => {
          const fieldErrors = error.data[field];
          if (Array.isArray(fieldErrors)) {
            backendErrors[field] = fieldErrors[0];
          } else if (typeof fieldErrors === "string") {
            backendErrors[field] = fieldErrors;
          }
        });
        setValidationErrors(backendErrors);
        const firstError = Object.values(backendErrors)[0];
        Alert.alert("Validation Error", firstError);
      } else {
        showToast(
          error.message || "Failed to save profile. Please try again.",
          "error"
        );
      }
      return false;
    }
  };

  React.useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
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
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center overflow-hidden">
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
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
                  )}
                  {isUploadingImage && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Pressable
                  className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full items-center justify-center border-2 border-white"
                  onPress={() => setShowProfileModal(true)}
                  disabled={isUploadingImage}
                >
                  <CameraIcon size={12} color="#FFFFFF" />
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[18px] font-bold text-black">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : user?.first_name || user?.email?.split("@")[0] || "User"}
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">
                  {user?.email || ""}
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
                <Text
                  className="underline"
                  onPress={() => navigation.navigate("Contact")}
                  style={{ textDecorationLine: "underline" }}
                >
                  Contact support
                </Text>{" "}
                if needed.
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
                Job Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.jobTitle
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={jobTitle}
                onChangeText={(text) => {
                  setJobTitle(text);
                  if (validationErrors.jobTitle) {
                    setValidationErrors({ ...validationErrors, jobTitle: "" });
                  }
                }}
                placeholder="Enter job title"
              />
              {validationErrors.jobTitle && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.jobTitle}
                </Text>
              )}
            </View>

            {/* Company */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Company <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.company
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={company}
                onChangeText={(text) => {
                  setCompany(text);
                  if (validationErrors.company) {
                    setValidationErrors({ ...validationErrors, company: "" });
                  }
                }}
                placeholder="Enter company name"
              />
              {validationErrors.company && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.company}
                </Text>
              )}
            </View>

            {/* LinkedIn */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                LinkedIn <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.linkedIn
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={linkedIn}
                onChangeText={(text) => {
                  setLinkedIn(text);
                  if (validationErrors.linkedIn) {
                    setValidationErrors({
                      ...validationErrors,
                      linkedIn: "",
                    });
                  }
                }}
                placeholder="LinkedIn profile URL or handle"
              />
              {validationErrors.linkedIn && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.linkedIn}
                </Text>
              )}
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
                Bio <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`bg-white border rounded-xl px-4 py-3 text-base text-black min-h-[100px] ${
                    validationErrors.bio
                      ? "border-red-500"
                      : "border-neutral-300"
                  }`}
                  value={bio}
                  onChangeText={(text) => {
                    setBio(text);
                    if (validationErrors.bio) {
                      setValidationErrors({ ...validationErrors, bio: "" });
                    }
                  }}
                  placeholder="Tell us about yourself (10-200 characters)"
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
              {validationErrors.bio && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.bio}
                </Text>
              )}
            </View>
          </View>

          {/* Top Interests */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <Text className="text-sm font-medium text-neutral-700 mb-1">
              Top Interests <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              Select 2-5 sectors you want to connect with
            </Text>
            {validationErrors.interests && (
              <Text className="text-red-500 text-xs mb-2">
                {validationErrors.interests}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => {
                      toggleInterest(interest);
                      if (validationErrors.interests) {
                        setValidationErrors({
                          ...validationErrors,
                          interests: "",
                        });
                      }
                    }}
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
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
        onRemovePhoto={handleRemovePhoto}
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

function AttendeeProfileSection({
  onSave,
  saveTrigger,
  isSubmitting,
  setIsSubmitting,
}: {
  onSave?: () => void;
  saveTrigger?: number;
  isSubmitting?: boolean;
  setIsSubmitting?: (value: boolean) => void;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [shouldRemovePhoto, setShouldRemovePhoto] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Get current profile picture from user
  const currentProfilePic = user?.profile_pic || null;
  const displayImageUri = shouldRemovePhoto
    ? null
    : selectedImageUri || currentProfilePic;

  // Load user data into form fields
  React.useEffect(() => {
    if (user) {
      // Set full name
      if (user.first_name || user.last_name) {
        setFullName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
      }

      // Set job title
      if (user.job_title) {
        setJobTitle(user.job_title);
      }

      // Set bio
      if (user.bio) {
        setBio(user.bio);
      }

      // Set country - find matching ID from label
      if (user.country) {
        const countryOption = COUNTRY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === user.country?.toLowerCase()
        );
        if (countryOption) {
          setSelectedCountry(countryOption.id);
        }
      }

      // Parse metadata (might be string or object)
      let metadata = user.metadata;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing metadata:", e);
          metadata = {};
        }
      }

      // Set industry from metadata - find matching ID from label
      if (metadata?.industry) {
        const industryOption = INDUSTRY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === metadata.industry.toLowerCase()
        );
        if (industryOption) {
          setSelectedIndustry(industryOption.id);
        }
      }

      // Set interests from metadata
      if (metadata?.interests && Array.isArray(metadata.interests)) {
        setSelectedInterests(metadata.interests);
      }
    }
  }, [user]);

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
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  // Image Picker Handlers
  const handleTakePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showToast("Failed to take photo. Please try again.", "error");
    }
  };

  const handleChoosePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select photos."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false);
      }
    } catch (error) {
      console.error("Error choosing photo:", error);
      showToast("Failed to select photo. Please try again.", "error");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setShowProfileModal(false);
      setSelectedImageUri(null);
      setShouldRemovePhoto(true);
    } catch (error) {
      console.error("Error removing photo:", error);
      showToast("Failed to remove photo. Please try again.", "error");
    }
  };

  // TODO: BACKEND INTEGRATION - Save attendee profile data to backend API
  // API Endpoint: PUT /api/user/profile/attendee
  // Request Body: { interests: string[], tags: string[] }
  // Response: { success: boolean, profile: AttendeeProfile }
  // TODO: BACKEND - Handle validation errors from backend
  // TODO: BACKEND - Show loading state during API call
  // TODO: BACKEND - Handle API errors and show error messages
  const handleSave = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.valid) {
      errors.fullName = fullNameValidation.error || "";
    }

    const jobTitleValidation = validateJobTitle(jobTitle);
    if (!jobTitleValidation.valid) {
      errors.jobTitle = jobTitleValidation.error || "";
    }

    const bioValidation = validateBio(bio);
    if (!bioValidation.valid) {
      errors.bio = bioValidation.error || "";
    }

    const interestsValidation = validateInterests(selectedInterests);
    if (!interestsValidation.valid) {
      errors.interests = interestsValidation.error || "";
    }

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return false;
    }

    try {
      if (setIsSubmitting) setIsSubmitting(true);
      // Handle profile picture upload or removal
      if (shouldRemovePhoto) {
        // Remove profile picture
        setIsUploadingImage(true);
        try {
          await authService.removeProfilePicture();
          setShouldRemovePhoto(false);
        } catch (imageError: any) {
          console.error("Error removing profile picture:", imageError);
          showToast(
            imageError.message || "Failed to remove profile picture.",
            "error"
          );
          setIsUploadingImage(false);
          if (setIsSubmitting) setIsSubmitting(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (selectedImageUri) {
        // Upload new profile picture
        setIsUploadingImage(true);
        try {
          await authService.uploadProfilePicture(selectedImageUri);
          setSelectedImageUri(null);
          setShouldRemovePhoto(false);
        } catch (imageError: any) {
          console.error("Error uploading profile picture:", imageError);
          showToast(
            imageError.message || "Failed to upload profile picture.",
            "error"
          );
          setIsUploadingImage(false);
          if (setIsSubmitting) setIsSubmitting(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Split fullName into first_name and last_name
      const nameParts = fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      // Get selected industry label
      const industryLabel =
        INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
        "";

      // Get selected country label
      const countryLabel =
        COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry)?.label || "";

      // Build metadata object for fields that don't have direct backend fields
      const metadata: any = {};
      if (industryLabel) {
        metadata.industry = industryLabel;
      }
      if (selectedInterests.length > 0) {
        metadata.interests = selectedInterests;
      }

      // Prepare API request payload
      const profileData: any = {
        first_name,
        last_name,
        job_title: jobTitle.trim(),
        bio: bio.trim() || null,
        country: countryLabel,
      };

      // Only include metadata if it has content
      if (Object.keys(metadata).length > 0) {
        profileData.metadata = metadata;
      }

      // Save profile data to backend API
      await authService.updateProfile(profileData);

      // Show success toast
      showToast("Profile saved successfully!", "success");

      // Call onSave callback if provided
      if (onSave) {
        await onSave();
      }

      if (setIsSubmitting) setIsSubmitting(false);
      return true;
    } catch (error: any) {
      console.error("Error saving profile:", error);

      // Handle backend validation errors
      if (error.responseCode === 400 && error.data) {
        const backendErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((field) => {
          const fieldErrors = error.data[field];
          if (Array.isArray(fieldErrors)) {
            backendErrors[field] = fieldErrors[0];
          } else if (typeof fieldErrors === "string") {
            backendErrors[field] = fieldErrors;
          }
        });
        setValidationErrors(backendErrors);
        const firstError = Object.values(backendErrors)[0];
        Alert.alert("Validation Error", firstError);
      } else {
        showToast(
          error.message || "Failed to save profile. Please try again.",
          "error"
        );
      }
      if (setIsSubmitting) setIsSubmitting(false);
      return false;
    }
  };

  React.useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
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
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center overflow-hidden">
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
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
                  )}
                  {isUploadingImage && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Pressable
                  className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full items-center justify-center border-2 border-white"
                  onPress={() => setShowProfileModal(true)}
                  disabled={isUploadingImage}
                >
                  <CameraIcon size={12} color="#FFFFFF" />
                </Pressable>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[18px] font-bold text-black">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : user?.first_name || user?.email?.split("@")[0] || "User"}
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">
                  {user?.email || ""}
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
                <Text
                  className="underline"
                  onPress={() => navigation.navigate("Contact")}
                  style={{ textDecorationLine: "underline" }}
                >
                  Contact support
                </Text>{" "}
                if needed.
              </Text>
            </View>
          </View>

          {/* Personal Information Section */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            {/* Full Name */}
            <View className="mb-4 pt-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.fullName
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (validationErrors.fullName) {
                    setValidationErrors({ ...validationErrors, fullName: "" });
                  }
                }}
                placeholder="Enter full name"
              />
              {validationErrors.fullName && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.fullName}
                </Text>
              )}
            </View>

            {/* Job Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Job Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.jobTitle
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={jobTitle}
                onChangeText={(text) => {
                  setJobTitle(text);
                  if (validationErrors.jobTitle) {
                    setValidationErrors({ ...validationErrors, jobTitle: "" });
                  }
                }}
                placeholder="Enter job title"
              />
              {validationErrors.jobTitle && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.jobTitle}
                </Text>
              )}
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
                Bio <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`bg-white border rounded-xl px-4 py-3 text-base text-black min-h-[100px] ${
                    validationErrors.bio
                      ? "border-red-500"
                      : "border-neutral-300"
                  }`}
                  value={bio}
                  onChangeText={(text) => {
                    setBio(text);
                    if (validationErrors.bio) {
                      setValidationErrors({ ...validationErrors, bio: "" });
                    }
                  }}
                  placeholder="Tell us about yourself (10-200 characters)"
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
              {validationErrors.bio && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.bio}
                </Text>
              )}
            </View>
          </View>

          {/* Top Interests */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <Text className="text-sm font-medium text-neutral-700 mb-1">
              Top Interests <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              Select 2-5 sectors you want to connect with
            </Text>
            {validationErrors.interests && (
              <Text className="text-red-500 text-xs mb-2">
                {validationErrors.interests}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => {
                      toggleInterest(interest);
                      if (validationErrors.interests) {
                        setValidationErrors({
                          ...validationErrors,
                          interests: "",
                        });
                      }
                    }}
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
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
        onRemovePhoto={handleRemovePhoto}
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

function CompanyProfileSection({
  onSave,
  saveTrigger,
  isSubmitting,
  setIsSubmitting,
}: {
  onSave?: () => void;
  saveTrigger?: number;
  isSubmitting?: boolean;
  setIsSubmitting?: (value: boolean) => void;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
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
  const [positions, setPositions] = useState<
    Array<{ id: string; role: string; link: string }>
  >([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [shouldRemovePhoto, setShouldRemovePhoto] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get current company logo from user
  const currentCompanyLogo = user?.company?.logo || null;
  // Show selected image if available, otherwise show current or null
  const displayImageUri = shouldRemovePhoto
    ? null
    : selectedImageUri || currentCompanyLogo;

  const dataLoadedRef = React.useRef(false);

  // Load company data into form fields (only on initial mount to prevent overwriting user edits)
  React.useEffect(() => {
    if (user?.company && !dataLoadedRef.current) {
      const company = user.company;

      // Set company name
      if (company.name) {
        setCompanyName(company.name);
      }

      // Parse metadata first (might be string or object)
      let metadata = company.metadata;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("Error parsing company metadata:", e);
          metadata = {};
        }
      }

      // Set booth number from metadata (check after parsing)
      if (metadata?.boothNumber) {
        setBoothNumber(metadata.boothNumber);
      }

      // Set website from metadata
      if (metadata?.website) {
        setWebsite(metadata.website);
      }

      // Set company description
      if (company.company_description) {
        setCompanyDescription(company.company_description);
      }

      // Set industry - find matching ID from label
      if (company.company_sector) {
        const industryOption = INDUSTRY_OPTIONS.find(
          (opt) =>
            opt.label.toLowerCase() === company.company_sector?.toLowerCase()
        );
        if (industryOption) {
          setSelectedIndustry(industryOption.id);
        }
      }

      // Set country - find matching ID from label
      if (company.country) {
        const countryOption = COUNTRY_OPTIONS.find(
          (opt) => opt.label.toLowerCase() === company.country?.toLowerCase()
        );
        if (countryOption) {
          setSelectedCountry(countryOption.id);
        }
      }

      // Set social links from metadata (check both direct and nested socialLinks object)
      // Note: metadata is already parsed above
      const socialLinks = metadata?.socialLinks || {};
      if (metadata?.linkedIn || socialLinks?.linkedin) {
        setLinkedIn(metadata?.linkedIn || socialLinks?.linkedin || "");
      }
      if (metadata?.facebook || socialLinks?.facebook) {
        setFacebook(metadata?.facebook || socialLinks?.facebook || "");
      }
      if (metadata?.instagram || socialLinks?.instagram) {
        setInstagram(metadata?.instagram || socialLinks?.instagram || "");
      }
      if (
        metadata?.xHandle ||
        metadata?.twitter ||
        socialLinks?.x ||
        socialLinks?.xHandle
      ) {
        setXHandle(
          metadata?.xHandle ||
            metadata?.twitter ||
            socialLinks?.x ||
            socialLinks?.xHandle ||
            ""
        );
      }

      // Set offers from metadata
      if (metadata?.offers && Array.isArray(metadata.offers)) {
        setOffers(metadata.offers);
      }

      // Set positions from metadata
      if (metadata?.positions && Array.isArray(metadata.positions)) {
        setPositions(metadata.positions);
      }

      // Set recruiting status
      if (typeof metadata?.isRecruiting === "boolean") {
        setIsRecruiting(metadata.isRecruiting);
      }

      // Clear validation errors when data loads
      setValidationErrors({});

      dataLoadedRef.current = true;
    }
  }, [user?.company]);

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
      setPositions([
        ...positions,
        {
          id: Date.now().toString(),
          role: newJobRole.trim(),
          link: newJobLink.trim() || "",
        },
      ]);
      setNewJobRole("");
      setNewJobLink("");
      setShowAddPosition(false);
    }
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  // Image Picker Handlers
  const handleTakePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false); // Clear removal flag if user selects new image
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showToast("Failed to take photo. Please try again.", "error");
    }
  };

  const handleChoosePhoto = async () => {
    try {
      setShowProfileModal(false);

      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select photos."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShouldRemovePhoto(false); // Clear removal flag if user selects new image
      }
    } catch (error) {
      console.error("Error choosing photo:", error);
      showToast("Failed to select photo. Please try again.", "error");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setShowProfileModal(false);
      setShouldRemovePhoto(true);
      setSelectedImageUri(null);
    } catch (error) {
      console.error("Error removing photo:", error);
      showToast("Failed to remove photo. Please try again.", "error");
    }
  };

  // TODO: BACKEND INTEGRATION - Save company profile data to backend API
  // API Endpoint: PUT /api/user/profile/company
  // Request Body: { companyName, industry, country, website, description, boothNumber, offers, socialLinks, openPositions, teamMembers, ... }
  // Response: { success: boolean, profile: CompanyProfile }
  // TODO: BACKEND - Handle validation errors from backend
  // TODO: BACKEND - Show loading state during API call
  // TODO: BACKEND - Handle API errors and show error messages
  const handleSave = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate all required fields
    const errors: Record<string, string> = {};

    const companyNameValidation = validateCompany(companyName);
    if (!companyNameValidation.valid) {
      errors.companyName = companyNameValidation.error || "";
    }

    const boothValidation = validateBoothNumber(boothNumber);
    if (!boothValidation.valid) {
      errors.boothNumber = boothValidation.error || "";
    }

    const websiteValidation = validateWebsite(website);
    if (!websiteValidation.valid) {
      errors.website = websiteValidation.error || "";
    }

    const descriptionValidation =
      validateCompanyDescription(companyDescription);
    if (!descriptionValidation.valid) {
      errors.companyDescription = descriptionValidation.error || "";
    }

    // Validate social links - at least one must be provided
    const hasAnySocialLink =
      linkedIn.trim() || facebook.trim() || instagram.trim() || xHandle.trim();

    if (!hasAnySocialLink) {
      errors.socialLinks = "Please provide at least one social media handle";
    }

    // Validate format of provided social links
    if (linkedIn.trim()) {
      const linkedInValidation = validateSocialHandle(linkedIn, "LinkedIn");
      if (!linkedInValidation.valid) {
        errors.linkedIn = linkedInValidation.error || "";
      }
    }

    if (facebook.trim()) {
      const facebookValidation = validateSocialHandle(facebook, "Facebook");
      if (!facebookValidation.valid) {
        errors.facebook = facebookValidation.error || "";
      }
    }

    if (instagram.trim()) {
      const instagramValidation = validateSocialHandle(instagram, "Instagram");
      if (!instagramValidation.valid) {
        errors.instagram = instagramValidation.error || "";
      }
    }

    if (xHandle.trim()) {
      const xValidation = validateSocialHandle(xHandle, "X/Twitter");
      if (!xValidation.valid) {
        errors.xHandle = xValidation.error || "";
      }
    }

    // Validate positions if recruiting is enabled
    if (isRecruiting && positions.length === 0) {
      errors.positions =
        "Please add at least one position when recruiting is enabled";
    }

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return false;
    }

    if (setIsSubmitting) {
      console.log("🔄 Setting isSubmitting to true");
      setIsSubmitting(true);
    }
    try {
      if (!user?.company?.id) {
        showToast("Company not found. Please contact support.", "error");
        if (setIsSubmitting) setIsSubmitting(false);
        return false;
      }

      // Handle company logo upload or removal
      if (shouldRemovePhoto) {
        // Remove company logo
        setIsUploadingImage(true);
        try {
          // TODO: Implement logo removal API call if available
          // await companyService.removeCompanyLogo(user.company.id);
          setShouldRemovePhoto(false);
        } catch (imageError: any) {
          console.error("Error removing company logo:", imageError);
          showToast(
            imageError.message || "Failed to remove company logo.",
            "error"
          );
          setIsUploadingImage(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (selectedImageUri) {
        // Upload new company logo (mimic Personal tab pattern)
        console.log("📸 Starting company logo upload...", selectedImageUri);
        setIsUploadingImage(true);
        try {
          console.log(
            "📸 Calling uploadCompanyLogo with companyId:",
            user.company.id
          );
          await companyService.uploadCompanyLogo(
            user.company.id,
            selectedImageUri
          );
          console.log("✅ Company logo uploaded successfully!");
          setSelectedImageUri(null); // Clear selected image after successful upload
          setShouldRemovePhoto(false); // Clear removal flag if it was set
        } catch (imageError: any) {
          console.error("❌ Error uploading company logo:", imageError);
          showToast(
            imageError.message || "Failed to upload company logo.",
            "error"
          );
          setIsUploadingImage(false);
          return false;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Get selected industry label
      const industryLabel =
        INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
        "";

      // Get selected country label
      const countryLabel =
        COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry)?.label || "";

      // Build metadata object for fields that don't have direct backend fields
      // Social links should be nested in socialLinks object for backend consistency
      const socialLinksObj: any = {};
      if (linkedIn.trim()) socialLinksObj.linkedin = linkedIn.trim();
      if (facebook.trim()) socialLinksObj.facebook = facebook.trim();
      if (instagram.trim()) socialLinksObj.instagram = instagram.trim();
      if (xHandle.trim()) socialLinksObj.x = xHandle.trim();

      const metadata: any = {
        boothNumber: boothNumber.trim() || undefined,
        website: website.trim() || undefined,
        offers: offers.length > 0 ? offers : undefined,
        positions: positions.length > 0 ? positions : undefined,
        isRecruiting,
      };

      // Only include socialLinks if at least one link exists
      if (Object.keys(socialLinksObj).length > 0) {
        metadata.socialLinks = socialLinksObj;
      }

      // Remove undefined values from metadata
      Object.keys(metadata).forEach((key) => {
        if (metadata[key] === undefined) {
          delete metadata[key];
        }
      });

      // Prepare API request payload
      const companyData: any = {
        name: companyName.trim(),
        company_sector: industryLabel,
        country: countryLabel,
        company_description: companyDescription.trim() || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      // Remove undefined values
      Object.keys(companyData).forEach((key) => {
        if (companyData[key] === undefined) {
          delete companyData[key];
        }
      });

      // Save company data to backend API
      await companyService.updateCompany(user.company.id, companyData);

      // Show success toast
      showToast("Company profile saved successfully!", "success");

      // Call onSave callback if provided (this refreshes user data)
      // Await to ensure user data is refreshed before component re-renders
      if (onSave) {
        await onSave();
      }

      // Clear selectedImageUri after user data is refreshed (so displayImageUri uses currentCompanyLogo from backend)
      setSelectedImageUri(null);

      if (setIsSubmitting) setIsSubmitting(false);
      return true;
    } catch (error: any) {
      console.error("Error saving company profile:", error);

      // Handle backend validation errors
      if (error.responseCode === 400 && error.data) {
        const backendErrors: Record<string, string> = {};
        Object.keys(error.data).forEach((field) => {
          const fieldErrors = error.data[field];
          if (Array.isArray(fieldErrors)) {
            backendErrors[field] = fieldErrors[0];
          } else if (typeof fieldErrors === "string") {
            backendErrors[field] = fieldErrors;
          }
        });
        setValidationErrors(backendErrors);
        const firstError = Object.values(backendErrors)[0];
        Alert.alert("Validation Error", firstError);
      } else {
        showToast(
          error.message || "Failed to save company profile. Please try again.",
          "error"
        );
      }
      if (setIsSubmitting) setIsSubmitting(false);
      return false;
    }
  };

  React.useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
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
                <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center overflow-hidden">
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
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
                  )}
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
                  {companyName || "Company Name"}
                </Text>
                <Text className="text-sm text-neutral-600 mt-1">
                  {boothNumber ? `Booth ${boothNumber}` : "No booth assigned"}
                </Text>
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
                <Text
                  className="underline"
                  onPress={() => navigation.navigate("Contact")}
                  style={{ textDecorationLine: "underline" }}
                >
                  Contact support
                </Text>{" "}
                if needed.
              </Text>
            </View>
          </View>

          {/* Company Information Section */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            {/* Company Name */}
            <View className="mb-4 pt-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Company Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.companyName
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  if (validationErrors.companyName) {
                    setValidationErrors({
                      ...validationErrors,
                      companyName: "",
                    });
                  }
                }}
                placeholder="Enter company name"
              />
              {validationErrors.companyName && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.companyName}
                </Text>
              )}
            </View>

            {/* Booth Number */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Booth Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.boothNumber
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={boothNumber}
                onChangeText={(text) => {
                  setBoothNumber(text);
                  if (validationErrors.boothNumber) {
                    setValidationErrors({
                      ...validationErrors,
                      boothNumber: "",
                    });
                  }
                }}
                placeholder="Enter booth number"
              />
              {validationErrors.boothNumber && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.boothNumber}
                </Text>
              )}
            </View>

            {/* Website */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-2">
                Website <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3 text-base text-black ${
                  validationErrors.website
                    ? "border-red-500"
                    : "border-neutral-300"
                }`}
                value={website}
                onChangeText={(text) => {
                  setWebsite(text);
                  if (validationErrors.website) {
                    setValidationErrors({
                      ...validationErrors,
                      website: "",
                    });
                  }
                }}
                placeholder="Enter website URL"
              />
              {validationErrors.website && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.website}
                </Text>
              )}
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
                Company Description <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`bg-white border rounded-xl px-4 py-3 text-base text-black min-h-[100px] ${
                    validationErrors.companyDescription
                      ? "border-red-500"
                      : "border-neutral-300"
                  }`}
                  value={companyDescription}
                  onChangeText={(text) => {
                    setCompanyDescription(text);
                    if (validationErrors.companyDescription) {
                      setValidationErrors({
                        ...validationErrors,
                        companyDescription: "",
                      });
                    }
                  }}
                  placeholder="Describe your company (10-200 characters)"
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
              {validationErrors.companyDescription && (
                <Text className="text-red-500 text-xs mt-1">
                  {validationErrors.companyDescription}
                </Text>
              )}
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
                    <TextInput
                      className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base text-black mb-3"
                      value={newJobLink}
                      onChangeText={setNewJobLink}
                      placeholder="Job Link"
                    />
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
                      key={position.id}
                      className="flex-row items-center px-4 py-2 rounded-full bg-white border border-neutral-300"
                    >
                      <Text className="text-sm font-medium text-black mr-2">
                        {position.role}
                      </Text>
                      <Pressable onPress={() => removePosition(position.id)}>
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
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
        onRemovePhoto={handleRemovePhoto}
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
  const { user, completeProfile } = useAuth();

  // Determine user role based on company association
  // If user has a company, show company profile tabs, otherwise show attendee profile
  const userRole: "attendee" | "company" = user?.company
    ? "company"
    : "attendee";
  const [activeTab, setActiveTab] = useState<"Personal" | "Company">(
    "Personal"
  );
  
  const [personalSaveTrigger, setPersonalSaveTrigger] = useState(0);
  const [companySaveTrigger, setCompanySaveTrigger] = useState(0);
  const [attendeeSaveTrigger, setAttendeeSaveTrigger] = useState(0);
  const [companyIsSubmitting, setCompanyIsSubmitting] = useState(false);
  const [attendeeIsSubmitting, setAttendeeIsSubmitting] = useState(false);

  const handleSavePersonal = () => {
    setPersonalSaveTrigger((prev) => prev + 1);
  };

  const handleSaveCompany = () => {
    setCompanySaveTrigger((prev) => prev + 1);
  };

  const handleSaveAttendee = () => {
    setAttendeeSaveTrigger((prev) => prev + 1);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Header />
        {userRole === "attendee" ? (
          <>
            <AttendeeProfileSection
              saveTrigger={attendeeSaveTrigger}
              onSave={completeProfile}
              isSubmitting={attendeeIsSubmitting}
              setIsSubmitting={setAttendeeIsSubmitting}
            />
            {/* Save Changes Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pb-10 pt-4">
              <Pressable
                className="bg-black rounded-xl items-center justify-center flex-row gap-2"
                style={{
                  paddingVertical: 12,
                  opacity: attendeeIsSubmitting ? 0.6 : 1,
                }}
                onPress={handleSaveAttendee}
                disabled={attendeeIsSubmitting}
              >
                {attendeeIsSubmitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text className="text-white pb-2 text-base font-inter-semibold">
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
              <PersonalProfileSection
                saveTrigger={personalSaveTrigger}
                onSave={completeProfile}
              />
            ) : (
              <CompanyProfileSection
                saveTrigger={companySaveTrigger}
                onSave={completeProfile}
                isSubmitting={companyIsSubmitting}
                setIsSubmitting={setCompanyIsSubmitting}
              />
            )}
            {/* Save Changes Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pb-10 pt-4">
              <Pressable
                className="bg-black rounded-xl items-center justify-center flex-row gap-2"
                style={{
                  paddingVertical: 12,
                  opacity:
                    activeTab === "Company" && companyIsSubmitting ? 0.6 : 1,
                }}
                onPress={
                  activeTab === "Personal"
                    ? handleSavePersonal
                    : handleSaveCompany
                }
                disabled={activeTab === "Company" && companyIsSubmitting}
              >
                {activeTab === "Company" && companyIsSubmitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text className="text-white pb-2 text-base font-semibold">
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
