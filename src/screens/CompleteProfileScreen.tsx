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
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type {
  RootStackParamList,
  RootStackScreenProps,
} from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { CloseIcon } from "../components/MenuIcons";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Industry/Sector options
const INDUSTRY_OPTIONS = [
  { id: "technology", label: "Technology" },
  { id: "fintech", label: "Fintech" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "sustainability", label: "Sustainability" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "transportation", label: "Transportation" },
];

// TODO: BACKEND INTEGRATION - Fetch country options from backend
// API Endpoint: GET /api/metadata/countries
// Response: { countries: { id: string, label: string, flag: string, code: string }[] }
// TODO: BACKEND - Cache country options in state management
// TODO: BACKEND - Handle loading and error states
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

// Offer colors
const OFFER_COLORS = [
  { id: "purple", label: "Purple", color: "#9333EA" },
  { id: "green", label: "Green", color: "#10B981" },
  { id: "blue", label: "Blue", color: "#3B82F6" },
  { id: "red", label: "Red", color: "#EF4444" },
  { id: "orange", label: "Orange", color: "#F59E0B" },
  { id: "pink", label: "Pink", color: "#EC4899" },
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

const validateOfferTitle = (
  title: string
): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: "Offer title is required" };
  }
  if (title.trim().length < 3) {
    return { valid: false, error: "Offer title must be at least 3 characters" };
  }
  if (title.trim().length > 100) {
    return {
      valid: false,
      error: "Offer title must be less than 100 characters",
    };
  }
  return { valid: true };
};

const validateJobRole = (role: string): { valid: boolean; error?: string } => {
  if (!role.trim()) {
    return { valid: false, error: "Job role is required" };
  }
  if (role.trim().length < 2) {
    return { valid: false, error: "Job role must be at least 2 characters" };
  }
  if (role.trim().length > 100) {
    return { valid: false, error: "Job role must be less than 100 characters" };
  }
  return { valid: true };
};

const validateJobLink = (link: string): { valid: boolean; error?: string } => {
  if (!link.trim()) {
    return { valid: false, error: "Job link is required" };
  }
  const urlPattern =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/.*)?$/i;

  if (!urlPattern.test(link.trim())) {
    return { valid: false, error: "Please enter a valid job application URL" };
  }
  return { valid: true };
};

const validateSocialHandle = (
  handle: string,
  platform: string
): { valid: boolean; error?: string } => {
  if (!handle.trim()) {
    return { valid: false, error: `${platform} handle is required` };
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

function CameraIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
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

// Icon components for social links (with color prop support)
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

function CloseXIcon({ size = 16, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12 4L4 12M4 4L12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Progress Indicator Component
function ProgressIndicator({
  currentStep = 1,
  totalSteps = 2,
}: {
  currentStep?: number;
  totalSteps?: number;
}) {
  return (
    <View className="px-6 pt-4 pb-2">
      <View className="flex-row gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            className={`flex-1 h-1 rounded-full ${
              index < currentStep ? "bg-black" : "bg-neutral-300"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

function ProfilePictureModal({
  visible,
  onClose,
  onTakePhoto,
  onChoosePhoto,
}: {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
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
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          <View className="px-6 pb-12">
            <Text className="text-[24px] font-bold text-black mb-6 text-center">
              Update Profile Picture
            </Text>

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
                onPress={onChoosePhoto}
                className="bg-neutral-100 border border-neutral-300 rounded-xl py-4 flex-row items-center justify-center"
              >
                <Text className="text-black text-base font-semibold">
                  Choose Photo
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
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
          </View>

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
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
          </View>

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

function OfferColorModal({
  visible,
  onClose,
  selectedColor,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onSelect: (colorId: string) => void;
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
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[50%]"
          onPress={(e) => e.stopPropagation()}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <View className="items-center pt-2 pb-2">
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
          </View>

          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[24px] font-bold text-black">
                Select Color
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
              >
                <CloseIcon size={20} color="#000000" />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {OFFER_COLORS.map((colorOption) => {
                const isSelected = selectedColor === colorOption.id;
                return (
                  <Pressable
                    key={colorOption.id}
                    onPress={() => {
                      onSelect(colorOption.id);
                      onClose();
                    }}
                    className="items-center"
                  >
                    <View
                      className={`w-16 h-16 rounded-xl ${
                        isSelected ? "border-2 border-black" : ""
                      }`}
                      style={{ backgroundColor: colorOption.color }}
                    />
                    <Text className="text-xs mt-2 text-neutral-700">
                      {colorOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Attendee Profile Form Component (single screen, no progress bar)
function AttendeeProfileForm() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  const handleCompleteProfile = async () => {
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
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: BACKEND INTEGRATION - Save profile data to backend API
      // API Endpoint: POST /api/user/profile/complete
      // Request Body: { fullName, email, phoneNumber, countryCode, country, industry, jobTitle, company, linkedIn, bio, website, interests, tags, ... }
      // Response: { success: boolean, user: User, message?: string }
      // TODO: BACKEND - Handle validation errors from backend
      // TODO: BACKEND - Handle duplicate email/phone validation
      // TODO: BACKEND - Upload profile image if provided (multipart form data)
      // TODO: BACKEND - Call completeProfile() in AuthContext after successful API response
      // await api.post('/profile/complete', { fullName, jobTitle, company, ... });
      // await completeProfile(); // Only call after successful API response

      // Show success toast
      showToast("Profile completed successfully!", "success");

      // Navigate to success screen (completeProfile will be called there)
      setTimeout(() => {
        navigation.navigate("ProfileCreated");
      }, 500);
    } catch (error) {
      // TODO: BACKEND - Handle specific error types (network, validation, server errors)
      console.error("Error completing profile:", error);
      showToast("Failed to complete profile. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <View className="px-6 py-6">
          {/* Title and Subtitle */}
          <View className="items-center mb-8">
            <Text className="text-[32px] font-bold text-neutral-900 text-center mb-2">
              Complete Your Personal Profile
            </Text>
            <Text className="text-base text-neutral-600 text-center">
              Help others connect with you
            </Text>
          </View>

          {/* Profile Photo Upload Section */}
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 mb-6 p-6 items-center">
            <View className="relative mb-4">
              <View className="w-32 h-32 rounded-full bg-neutral-200 items-center justify-center">
                <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
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
                className="absolute bottom-0 right-0 w-10 h-10 bg-black rounded-full items-center justify-center border-2 border-white"
                onPress={() => setShowProfileModal(true)}
              >
                <CameraIcon size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Upload a photo of yourself
            </Text>
            <Text className="text-xs text-neutral-500">
              Recommended: 400x400px minimum
            </Text>
          </View>

          {/* Form Fields */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-4 py-4">
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <TextInput
                    className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                <Pressable className="bg-neutral-200 border border-neutral-300 rounded-xl px-4 py-3">
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
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-neutral-900">
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
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-neutral-900">
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
                  className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 min-h-[100px] ${
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

      {/* Next Button - Fixed at Bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pt-4 pb-6"
        style={{
          paddingBottom: Platform.OS === "ios" ? 34 : 24,
        }}
      >
        <Pressable
          onPress={handleCompleteProfile}
          disabled={isSubmitting || selectedInterests.length < 2}
          className={`rounded-xl py-4 items-center justify-center ${
            selectedInterests.length >= 2 && !isSubmitting
              ? "bg-black"
              : "bg-neutral-300"
          }`}
          style={{
            opacity: selectedInterests.length >= 2 && !isSubmitting ? 1 : 0.6,
          }}
        >
          <Text className="text-white text-base font-semibold">
            Complete your profile
          </Text>
        </Pressable>
      </View>

      {/* Modals */}
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

// Personal Profile Form Component (Step 1 of 2 for Company/Partner accounts)
function PersonalProfileForm() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  const handleNext = async () => {
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
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Save personal profile data to backend API
      // await api.post('/profile/personal', { fullName, jobTitle, company, ... });

      // Show success toast
      showToast("Personal profile saved!", "success");

      // Navigate to company profile (step 2)
      setTimeout(() => {
        navigation.navigate("CompleteProfile", { step: "company" });
      }, 500);
    } catch (error) {
      console.error("Error saving personal profile:", error);
      showToast("Failed to save profile. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <ProgressIndicator currentStep={1} totalSteps={2} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="px-6 py-6">
          {/* Title and Subtitle */}
          <View className="items-center mb-8">
            <Text className="text-[32px] font-bold text-neutral-900 text-center mb-2">
              Complete Your Personal Profile
            </Text>
            <Text className="text-base text-neutral-600 text-center">
              Help others connect with you
            </Text>
          </View>

          {/* Profile Photo Upload Section */}
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 mb-6 p-6 items-center">
            <View className="relative mb-4">
              <View className="w-32 h-32 rounded-full bg-neutral-200 items-center justify-center">
                <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
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
                className="absolute bottom-0 right-0 w-10 h-10 bg-black rounded-full items-center justify-center border-2 border-white"
                onPress={() => setShowProfileModal(true)}
              >
                <CameraIcon size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Upload a photo of yourself
            </Text>
            <Text className="text-xs text-neutral-500">
              Recommended: 400x400px minimum
            </Text>
          </View>

          {/* Form Fields */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-4 py-4">
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <TextInput
                    className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                <Pressable className="bg-neutral-200 border border-neutral-300 rounded-xl px-4 py-3">
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
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-neutral-900">
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
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-neutral-900">
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
                  className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 min-h-[100px] ${
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

      {/* Next Button - Fixed at Bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pt-4 pb-6"
        style={{
          paddingBottom: Platform.OS === "ios" ? 34 : 24,
        }}
      >
        <Pressable
          onPress={handleNext}
          disabled={isSubmitting}
          className={`rounded-xl py-4 items-center justify-center ${
            !isSubmitting ? "bg-black" : "bg-neutral-300"
          }`}
          style={{
            opacity: !isSubmitting ? 1 : 0.6,
          }}
        >
          <Text className="text-white text-base font-semibold">Next</Text>
        </Pressable>
      </View>

      {/* Modals */}
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

// Company Profile Form Component (Step 2 of 2 for Company/Partner accounts)
function CompanyProfileForm() {
  const { completeProfile } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [companyDescription, setCompanyDescription] = useState("");
  const [offers, setOffers] = useState<
    Array<{ id: string; title: string; color: string }>
  >([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferColor, setNewOfferColor] = useState("purple");
  const [showColorModal, setShowColorModal] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    facebook: "",
    instagram: "",
    x: "",
  });
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPositionRole, setNewPositionRole] = useState("");
  const [newPositionLink, setNewPositionLink] = useState("");
  const [positions, setPositions] = useState<
    Array<{ id: string; role: string; link: string }>
  >([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});
  const [positionErrors, setPositionErrors] = useState<Record<string, string>>(
    {}
  );

  const selectedIndustryLabel =
    INDUSTRY_OPTIONS.find((opt) => opt.id === selectedIndustry)?.label ||
    "Technology";
  const selectedCountryData =
    COUNTRY_OPTIONS.find((opt) => opt.id === selectedCountry) ||
    COUNTRY_OPTIONS[0];

  const handleAddOffer = () => {
    const offerValidation = validateOfferTitle(newOfferTitle);
    if (!offerValidation.valid) {
      setOfferErrors({ newOfferTitle: offerValidation.error || "" });
      return;
    }

    setOffers([
      ...offers,
      {
        id: Date.now().toString(),
        title: newOfferTitle,
        color: newOfferColor,
      },
    ]);
    setNewOfferTitle("");
    setNewOfferColor("purple");
    setShowAddOffer(false);
    setOfferErrors({});
  };

  const handleRemoveOffer = (id: string) => {
    setOffers(offers.filter((offer) => offer.id !== id));
  };

  const handleAddPosition = () => {
    const roleValidation = validateJobRole(newPositionRole);
    const linkValidation = validateJobLink(newPositionLink);

    const errors: Record<string, string> = {};
    if (!roleValidation.valid) {
      errors.newPositionRole = roleValidation.error || "";
    }
    if (!linkValidation.valid) {
      errors.newPositionLink = linkValidation.error || "";
    }

    if (Object.keys(errors).length > 0) {
      setPositionErrors(errors);
      return;
    }

    setPositions([
      ...positions,
      {
        id: Date.now().toString(),
        role: newPositionRole,
        link: newPositionLink,
      },
    ]);
    setNewPositionRole("");
    setNewPositionLink("");
    setShowAddPosition(false);
    setPositionErrors({});
  };

  const handleRemovePosition = (id: string) => {
    setPositions(positions.filter((pos) => pos.id !== id));
  };

  const handleDone = async () => {
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

    // Validate social links - at least one must be provided, and if provided must be valid format
    const hasAnySocialLink =
      socialLinks.linkedin.trim() ||
      socialLinks.facebook.trim() ||
      socialLinks.instagram.trim() ||
      socialLinks.x.trim();

    if (!hasAnySocialLink) {
      errors.socialLinks = "Please provide at least one social media handle";
    }

    // Validate format of provided social links
    if (socialLinks.linkedin.trim()) {
      const linkedInValidation = validateSocialHandle(
        socialLinks.linkedin,
        "LinkedIn"
      );
      if (!linkedInValidation.valid) {
        errors.linkedIn = linkedInValidation.error || "";
      }
    }

    if (socialLinks.facebook.trim()) {
      const facebookValidation = validateSocialHandle(
        socialLinks.facebook,
        "Facebook"
      );
      if (!facebookValidation.valid) {
        errors.facebook = facebookValidation.error || "";
      }
    }

    if (socialLinks.instagram.trim()) {
      const instagramValidation = validateSocialHandle(
        socialLinks.instagram,
        "Instagram"
      );
      if (!instagramValidation.valid) {
        errors.instagram = instagramValidation.error || "";
      }
    }

    if (socialLinks.x.trim()) {
      const xValidation = validateSocialHandle(socialLinks.x, "X/Twitter");
      if (!xValidation.valid) {
        errors.x = xValidation.error || "";
      }
    }

    // Validate positions if recruiting is enabled
    if (isRecruiting && positions.length === 0) {
      errors.positions =
        "Please add at least one position when recruiting is enabled";
    }

    // Validate each position
    positions.forEach((position, index) => {
      const roleValidation = validateJobRole(position.role);
      const linkValidation = validateJobLink(position.link);
      if (!roleValidation.valid) {
        errors[`position_role_${index}`] = `Position ${index + 1}: ${
          roleValidation.error
        }`;
      }
      if (!linkValidation.valid) {
        errors[`position_link_${index}`] = `Position ${index + 1}: ${
          linkValidation.error
        }`;
      }
    });

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Save company profile data to backend API
      // await api.post('/company/profile/complete', { companyName, boothNumber, ... });

      // Show success toast
      showToast("Company profile completed successfully!", "success");

      // Navigate to success screen (completeProfile will be called there)
      setTimeout(() => {
        navigation.navigate("ProfileCreated");
      }, 500);
    } catch (error) {
      console.error("Error completing profile:", error);
      showToast("Failed to complete profile. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <ProgressIndicator currentStep={2} totalSteps={2} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="px-6 py-6">
          {/* Title and Subtitle */}
          <View className="items-center mb-8">
            <Text className="text-[32px] font-bold text-neutral-900 text-center mb-2">
              Complete Your Company Profile
            </Text>
            <Text className="text-base text-neutral-600 text-center">
              Help others connect with your business
            </Text>
          </View>

          {/* Company Logo Upload Section */}
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 mb-6 p-6 items-center">
            <View className="relative mb-4">
              <View className="w-32 h-32 rounded-full bg-neutral-200 items-center justify-center">
                <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
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
                className="absolute bottom-0 right-0 w-10 h-10 bg-black rounded-full items-center justify-center border-2 border-white"
                onPress={() => setShowProfileModal(true)}
              >
                <CameraIcon size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Upload a logo of company
            </Text>
            <Text className="text-xs text-neutral-500">
              Recommended: 400x400px minimum
            </Text>
          </View>

          {/* Company Information Fields */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-4 py-4">
            {/* Company Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Company Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Booth Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Website <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <TextInput
                    className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 ${
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
                <Pressable className="bg-neutral-200 border border-neutral-300 rounded-xl px-4 py-3">
                  <Text className="text-sm font-medium text-black">
                    Paste link
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Industry/Sector */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Industry/Sector
              </Text>
              <Pressable
                onPress={() => setShowIndustryModal(true)}
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-base text-neutral-900">
                  {selectedIndustryLabel}
                </Text>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Country */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Country
              </Text>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-xl mr-2">
                    {selectedCountryData.flag}
                  </Text>
                  <Text className="text-base text-neutral-900">
                    {selectedCountryData.label}
                  </Text>
                </View>
                <ChevronDownIcon size={20} color="#404040" />
              </Pressable>
            </View>

            {/* Company Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Company Description <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TextInput
                  className={`bg-neutral-100 border rounded-xl px-4 py-3 text-base text-neutral-900 min-h-[100px] ${
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
                  placeholder="Tell us about your company (10-200 characters)"
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

          {/* Event Offers Section */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-medium text-neutral-700">
                Event Offers
              </Text>
              <Pressable onPress={() => setShowAddOffer(!showAddOffer)}>
                <Text className="text-blue-600 text-sm font-medium">
                  + Add Offer
                </Text>
              </Pressable>
            </View>

            {showAddOffer && (
              <View className="mb-4 gap-3">
                <TextInput
                  className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 text-base text-neutral-900"
                  value={newOfferTitle}
                  onChangeText={setNewOfferTitle}
                  placeholder="Offer title (e.g., Free Consultation)"
                />
                <Pressable
                  onPress={() => setShowColorModal(true)}
                  className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-6 h-6 rounded"
                      style={{
                        backgroundColor:
                          OFFER_COLORS.find((c) => c.id === newOfferColor)
                            ?.color || "#9333EA",
                      }}
                    />
                    <Text className="text-base text-neutral-900">
                      {OFFER_COLORS.find((c) => c.id === newOfferColor)
                        ?.label || "Purple"}
                    </Text>
                  </View>
                  <ChevronDownIcon size={20} color="#404040" />
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleAddOffer}
                    className="flex-1 bg-neutral-800 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white text-sm font-medium">Add</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowAddOffer(false);
                      setNewOfferTitle("");
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

            {/* Existing Offers */}
            <View className="flex-row flex-wrap gap-2 py-2">
              {offers.map((offer) => {
                const colorData = OFFER_COLORS.find(
                  (c) => c.id === offer.color
                );
                return (
                  <View
                    key={offer.id}
                    className="flex-row items-center rounded-full px-4 py-2"
                    style={{ backgroundColor: colorData?.color || "#9333EA" }}
                  >
                    <Text className="text-white text-sm font-medium mr-2">
                      {offer.title}
                    </Text>
                    <Pressable onPress={() => handleRemoveOffer(offer.id)}>
                      <CloseXIcon size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Social Links */}
          <View className="rounded-2xl border border-neutral-200 mb-6 px-2">
            <View className=" p-2">
              <Text className="text-[14px] font-semibold text-neutral-700 mb-1">
                Social Links <Text className="text-red-500">*</Text>
              </Text>
              <Text className="text-xs text-neutral-500 mb-3">
                At least one social media handle is required
              </Text>
              {validationErrors.socialLinks && (
                <Text className="text-red-500 text-xs mb-2">
                  {validationErrors.socialLinks}
                </Text>
              )}

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <LinkedInIcon size={22} color="#404040" />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className={`flex-1 bg-white border rounded-xl px-4 py-2 text-base text-black ${
                        validationErrors.linkedIn
                          ? "border-red-500"
                          : "border-neutral-300"
                      }`}
                      value={socialLinks.linkedin}
                      onChangeText={(text) => {
                        setSocialLinks({ ...socialLinks, linkedin: text });
                        if (validationErrors.linkedIn) {
                          setValidationErrors({
                            ...validationErrors,
                            linkedIn: "",
                          });
                        }
                        if (validationErrors.socialLinks) {
                          setValidationErrors({
                            ...validationErrors,
                            socialLinks: "",
                          });
                        }
                      }}
                      placeholder="LinkedIn handle"
                      style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                    />
                    {validationErrors.linkedIn && (
                      <Text className="text-red-500 text-xs mt-1">
                        {validationErrors.linkedIn}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <FacebookIcon size={22} color="#404040" />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className={`flex-1 bg-white border rounded-xl px-4 py-2 text-base text-black ${
                        validationErrors.facebook
                          ? "border-red-500"
                          : "border-neutral-300"
                      }`}
                      value={socialLinks.facebook}
                      onChangeText={(text) => {
                        setSocialLinks({ ...socialLinks, facebook: text });
                        if (validationErrors.facebook) {
                          setValidationErrors({
                            ...validationErrors,
                            facebook: "",
                          });
                        }
                        if (validationErrors.socialLinks) {
                          setValidationErrors({
                            ...validationErrors,
                            socialLinks: "",
                          });
                        }
                      }}
                      placeholder="Facebook handle"
                      style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                    />
                    {validationErrors.facebook && (
                      <Text className="text-red-500 text-xs mt-1">
                        {validationErrors.facebook}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <InstagramIcon size={22} color="#404040" />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className={`flex-1 bg-white border rounded-xl px-4 py-2 text-base text-black ${
                        validationErrors.instagram
                          ? "border-red-500"
                          : "border-neutral-300"
                      }`}
                      value={socialLinks.instagram}
                      onChangeText={(text) => {
                        setSocialLinks({ ...socialLinks, instagram: text });
                        if (validationErrors.instagram) {
                          setValidationErrors({
                            ...validationErrors,
                            instagram: "",
                          });
                        }
                        if (validationErrors.socialLinks) {
                          setValidationErrors({
                            ...validationErrors,
                            socialLinks: "",
                          });
                        }
                      }}
                      placeholder="Instagram handle"
                      style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                    />
                    {validationErrors.instagram && (
                      <Text className="text-red-500 text-xs mt-1">
                        {validationErrors.instagram}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 items-center justify-center border border-neutral-300 p-2 rounded-full mr-3">
                    <XIcon size={22} color="#404040" />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className={`flex-1 bg-white border rounded-xl px-4 py-2 text-base text-black ${
                        validationErrors.x
                          ? "border-red-500"
                          : "border-neutral-300"
                      }`}
                      value={socialLinks.x}
                      onChangeText={(text) => {
                        setSocialLinks({ ...socialLinks, x: text });
                        if (validationErrors.x) {
                          setValidationErrors({ ...validationErrors, x: "" });
                        }
                        if (validationErrors.socialLinks) {
                          setValidationErrors({
                            ...validationErrors,
                            socialLinks: "",
                          });
                        }
                      }}
                      placeholder="X handle"
                      style={{ height: 42, minHeight: 42, maxHeight: 42 }}
                    />
                    {validationErrors.x && (
                      <Text className="text-red-500 text-xs mt-1">
                        {validationErrors.x}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Recruiting Section */}
          <View className="mb-6 rounded-2xl border border-neutral-200 p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-medium text-neutral-700">
                Recruiting - Open Positions
              </Text>
              <Switch
                value={isRecruiting}
                onValueChange={setIsRecruiting}
                trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isRecruiting && (
              <>
                {showAddPosition && (
                  <View className="mb-4 gap-3">
                    <TextInput
                      className="bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 text-base text-neutral-900"
                      value={newPositionRole}
                      onChangeText={setNewPositionRole}
                      placeholder="Job Role"
                    />
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-3 text-base text-neutral-900"
                        value={newPositionLink}
                        onChangeText={setNewPositionLink}
                        placeholder="Job Link"
                      />
                      <Pressable className="bg-neutral-200 border border-neutral-300 rounded-xl px-4 py-3">
                        <Text className="text-sm font-medium text-black">
                          Paste link
                        </Text>
                      </Pressable>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={handleAddPosition}
                        className="flex-1 bg-neutral-800 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white text-sm font-medium">
                          Add Position
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setShowAddPosition(false);
                          setNewPositionRole("");
                          setNewPositionLink("");
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
                    className="mb-4"
                  >
                    <Text className="text-blue-600 text-sm font-medium">
                      + Add Position
                    </Text>
                  </Pressable>
                )}

                {/* Existing Positions */}
                <View className="flex-row flex-wrap gap-2">
                  {positions.map((position) => (
                    <View
                      key={position.id}
                      className="flex-row items-center rounded-full px-4 py-2 bg-white border border-neutral-300"
                    >
                      <Text className="text-black text-sm font-medium mr-2">
                        {position.role}
                      </Text>
                      <Pressable
                        onPress={() => handleRemovePosition(position.id)}
                      >
                        <CloseXIcon size={14} color="#000000" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Done Button - Fixed at Bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pt-4 pb-6"
        style={{
          paddingBottom: Platform.OS === "ios" ? 34 : 24,
        }}
      >
        <Pressable
          onPress={handleDone}
          disabled={isSubmitting}
          className={`rounded-xl py-4 items-center justify-center ${
            !isSubmitting ? "bg-black" : "bg-neutral-300"
          }`}
          style={{
            opacity: !isSubmitting ? 1 : 0.6,
          }}
        >
          <Text className="text-white text-base font-semibold">Done</Text>
        </Pressable>
      </View>

      {/* Modals */}
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
      <OfferColorModal
        visible={showColorModal}
        onClose={() => setShowColorModal(false)}
        selectedColor={newOfferColor}
        onSelect={setNewOfferColor}
      />
    </KeyboardAvoidingView>
  );
}

type Props = RootStackScreenProps<"CompleteProfile">;

export default function CompleteProfileScreen({ route }: Props) {
  const { user } = useAuth();

  // TODO: BACKEND INTEGRATION - Determine user type from backend/context based on email
  // API Endpoint: GET /api/user/type or check user object from AuthContext
  // Response: { userType: "attendee" | "company" }
  // TODO: BACKEND - Fetch user type on component mount
  // TODO: BACKEND - Handle loading and error states
  // For now, checking route params for step, or defaulting based on email domain
  // In production, this should come from backend API based on user's email
  const getUserType = (): "attendee" | "company" => {
    // If route has step param, use it (for company flow)
    if (route.params?.step === "company") {
      return "company";
    }

    // TODO: BACKEND - Check user email against backend to determine if attendee or company
    // TODO: BACKEND - Call API: await api.get('/user/type') or check user.type from AuthContext
    // For now, defaulting to "attendee" - update this logic based on your backend
    // Example: if (user?.email?.endsWith("@company.com")) return "company";

    return "attendee";
    // return "company";
  };

  const userType = getUserType();
  const currentStep = route.params?.step;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {userType === "attendee" ? (
        <AttendeeProfileForm />
      ) : currentStep === "company" ? (
        <CompanyProfileForm />
      ) : (
        <PersonalProfileForm />
      )}
    </SafeAreaView>
  );
}
