import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoadingSpinner } from "./index";
import { CloseIcon } from "./MenuIcons";
import { companyService } from "../services/companyService";
import { eventService, type Company } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { INDUSTRY_OPTIONS } from "../constants/industryAndInterests";
import { COUNTRY_OPTIONS } from "../constants/countries";
import {
  GROWTH_STAGE_OPTIONS,
  growthStageLabelFromId,
  validateYearFounded,
} from "../constants/startupGrowthStages";
import {
  buildFounderSavePayloads,
  validateFounderEmail,
} from "../utils/founderUtils";
import { readImageAsBase64 } from "../services/authService";
import { useStartupJoin } from "../hooks/useStartupJoin";
import { shouldShowStartupJoinForm } from "../utils/startupJoinStatus";
import { StartupJoinStatusCard } from "./StartupJoinStatusCard";
import { StartupJoinAdminPanel } from "./StartupJoinAdminPanel";
import { ChevronDownIcon } from "./icons";

const INPUT_PLACEHOLDER = "#9CA3AF";

type ScreenPhase = "search" | "create";

type FounderEntry = {
  id: string;
  name: string;
  role: string;
  email: string;
  linkedIn: string;
  imageUri: string | null;
};

type JobOpening = {
  id: string;
  title: string;
  applyUrl: string;
};

export interface StartupConnectStepProps {
  onSkip?: () => void;
  embedded?: boolean;
  variant?: "onboarding" | "manage";
  onComplete?: () => void;
}

let entryId = 0;
function nextId() {
  entryId += 1;
  return `entry-${entryId}`;
}

function validateRequiredText(
  value: string,
  label: string,
  minLen = 1,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < minLen) {
    return `${label} must be at least ${minLen} characters`;
  }
  return null;
}

function validateUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (!/^https?:\/\/\S+/i.test(trimmed)) {
    return `${label} must be a valid URL (https://...)`;
  }
  return null;
}

function validateLinkedInUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "LinkedIn is required";
  const looksLikeUrl =
    /^https?:\/\/\S+/i.test(trimmed) || trimmed.includes("linkedin");
  if (!looksLikeUrl) {
    return "Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname)";
  }
  return null;
}

function validateCreateStartupForm(input: {
  startupName: string;
  logoUri: string | null;
  problem: string;
  solution: string;
  description: string;
  website: string;
  pitchDeckUrl: string;
  growthStageId: string;
  yearFounded: string;
  founders: FounderEntry[];
  jobOpenings: JobOpening[];
}): string | null {
  const checks = [
    validateRequiredText(input.startupName, "Startup name", 2),
    !input.logoUri ? "Logo is required" : null,
    validateRequiredText(input.problem, "The Problem", 10),
    validateRequiredText(input.solution, "The Solution", 10),
    validateRequiredText(input.description, "Description", 10),
    validateUrl(input.website, "Website"),
    validateUrl(input.pitchDeckUrl, "Pitch deck link"),
    !input.growthStageId ? "Current growth stage is required" : null,
    validateYearFounded(input.yearFounded),
  ].filter(Boolean) as string[];

  const completeFounders = input.founders.filter(
    (f) =>
      f.name.trim() && f.role.trim() && f.email.trim() && f.linkedIn.trim(),
  );
  if (completeFounders.length === 0) {
    checks.push(
      "At least one founder with name, role, email, and LinkedIn is required",
    );
  }
  input.founders.forEach((f, i) => {
    const partial =
      f.name.trim() || f.role.trim() || f.email.trim() || f.linkedIn.trim();
    if (!partial) return;
    const nameErr = validateRequiredText(f.name, `Founder ${i + 1} name`, 2);
    if (nameErr) checks.push(nameErr);
    const roleErr = validateRequiredText(f.role, `Founder ${i + 1} role`, 2);
    if (roleErr) checks.push(roleErr);
    const emailErr = validateFounderEmail(f.email);
    if (emailErr) checks.push(`Founder ${i + 1}: ${emailErr}`);
    const liErr = validateLinkedInUrl(f.linkedIn);
    if (liErr) checks.push(`Founder ${i + 1}: ${liErr}`);
  });

  input.jobOpenings.forEach((j, i) => {
    const partial = j.title.trim() || j.applyUrl.trim();
    if (!partial) return;
    const titleErr = validateRequiredText(j.title, `Job ${i + 1} title`, 2);
    if (titleErr) checks.push(titleErr);
    const urlErr = validateUrl(j.applyUrl, `Job ${i + 1} apply link`);
    if (urlErr) checks.push(urlErr);
  });

  return checks[0] ?? null;
}

function SearchIcon({ size = 20, color = "#737373" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={2} />
      <Path d="M20 20L16.5 16.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z"
        fill={color}
      />
    </Svg>
  );
}

export default function StartupConnectStep({
  onSkip,
  embedded = false,
  variant = "onboarding",
  onComplete,
}: StartupConnectStepProps) {
  const { completeProfile } = useAuth();
  const {
    viewState,
    isLoading: isJoinStatusLoading,
    isActing,
    refresh,
    approveRequest,
    denyRequest,
  } = useStartupJoin();

  const showConnectForm = shouldShowStartupJoinForm(viewState);
  const [screenPhase, setScreenPhase] = useState<ScreenPhase>("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const [startupName, setStartupName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("technology");
  const [selectedCountry, setSelectedCountry] = useState("nigeria");
  const [selectedGrowthStage, setSelectedGrowthStage] = useState("seed");
  const [yearFounded, setYearFounded] = useState("");
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showGrowthStageModal, setShowGrowthStageModal] = useState(false);
  const [founders, setFounders] = useState<FounderEntry[]>([
    { id: nextId(), name: "", role: "", email: "", linkedIn: "", imageUri: null },
  ]);
  const [foundersExpanded, setFoundersExpanded] = useState(true);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);

  const finishFlow = useCallback(async () => {
    if (variant === "manage") {
      onComplete?.();
      return;
    }
    await AsyncStorage.setItem("@spark:profile_just_saved", "true");
    try {
      await completeProfile();
    } catch {
      Alert.alert(
        "Error",
        "We're having trouble entering the app. Please try again.",
      );
    }
  }, [completeProfile, onComplete, variant]);

  const runSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const { companies } = await eventService.getDirectoryCompanies(
        EVENT_ID,
        "startup",
        { search: query.trim() || undefined, page_size: 30 },
      );
      setResults(companies);
    } catch (e: unknown) {
      setResults([]);
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Could not search startups";
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!showConnectForm || screenPhase !== "search") return;
    const t = setTimeout(() => {
      void runSearch(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search, runSearch, screenPhase, showConnectForm]);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to upload a logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const pickFounderPhoto = async (founderId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to upload a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setFounders((prev) =>
        prev.map((f) =>
          f.id === founderId ? { ...f, imageUri: result.assets[0].uri } : f,
        ),
      );
    }
  };

  const selectStartup = (company: Company) => {
    const id = Number(company.id);
    setSelectedCompanyId(id);
    setSelectedCompanyName(company.name ?? "");
  };

  const handleRequestJoin = async () => {
    if (!selectedCompanyId) {
      Alert.alert(
        "Select your startup",
        "Search for your startup's name and tap it in the list, then tap Request to Join.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await companyService.requestJoinCompany(selectedCompanyId);
      await refresh();
      Alert.alert(
        "Request sent",
        `Your request to join ${selectedCompanyName || "the startup"} is pending. You can use the app right away — once the startup admin approves, you'll get a badge on your profile.`,
        variant === "onboarding"
          ? [{ text: "Continue to app", onPress: () => void finishFlow() }]
          : [{ text: "OK" }],
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not send join request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStartup = async () => {
    const validationError = validateCreateStartupForm({
      startupName,
      logoUri,
      problem,
      solution,
      description,
      website,
      pitchDeckUrl,
      growthStageId: selectedGrowthStage,
      yearFounded,
      founders,
      jobOpenings,
    });
    if (validationError) {
      Alert.alert("Missing information", validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const industryLabel =
        INDUSTRY_OPTIONS.find((o) => o.id === selectedIndustry)?.label ?? "";
      const countryLabel =
        COUNTRY_OPTIONS.find((o) => o.id === selectedCountry)?.label ?? "";
      const growthStageLabel = growthStageLabelFromId(selectedGrowthStage);
      const {
        metadataFounders,
        apiFounders,
        validationError: founderError,
      } = await buildFounderSavePayloads(
        founders.map((f) => ({
          ...f,
          imageUrl: null,
        })),
        readImageAsBase64,
      );
      if (founderError) {
        Alert.alert("Missing information", founderError);
        setIsSubmitting(false);
        return;
      }
      if (apiFounders.length === 0) {
        Alert.alert(
          "Missing information",
          "At least one founder with name, role, email, and LinkedIn is required",
        );
        setIsSubmitting(false);
        return;
      }
      const jobs = jobOpenings
        .filter((j) => j.title.trim() && j.applyUrl.trim())
        .map((j) => ({
          title: j.title.trim(),
          apply_url: j.applyUrl.trim(),
        }));

      const created = await companyService.createCompany({
        name: startupName.trim(),
        company_type: "startup",
        event_id: EVENT_ID,
        country: countryLabel,
        company_sector: industryLabel,
        company_description: description.trim(),
        founders: apiFounders,
        metadata: {
          problem: problem.trim(),
          solution: solution.trim(),
          website: website.trim(),
          pitch_deck_url: pitchDeckUrl.trim(),
          growth_stage: growthStageLabel,
          year_founded: yearFounded.trim(),
          founders: metadataFounders,
          job_openings: jobs.length > 0 ? jobs : undefined,
        },
      });

      if (logoUri && created.id) {
        try {
          await companyService.updateCompany(
            Number(created.id),
            {},
            { imageUri: logoUri },
          );
        } catch {
          Alert.alert(
            "Logo upload failed",
            "Your startup was created but the logo could not be uploaded. Add it from Manage Profile.",
          );
        }
      }

      await refresh();
      Alert.alert(
        "Startup registered",
        "You're the admin for this startup. You can update your startup profile anytime from Manage Profile.",
        variant === "onboarding"
          ? [{ text: "Continue to app", onPress: () => void finishFlow() }]
          : [{ text: "OK", onPress: () => onComplete?.() }],
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create startup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const industryLabel =
    INDUSTRY_OPTIONS.find((o) => o.id === selectedIndustry)?.label ?? "Select industry";
  const countryLabel =
    COUNTRY_OPTIONS.find((o) => o.id === selectedCountry)?.label ?? "Select country";
  const growthStageLabel =
    growthStageLabelFromId(selectedGrowthStage) || "Select growth stage";

  const horizontalPad = embedded ? 24 : 24;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: embedded ? 120 : 140,
          paddingHorizontal: horizontalPad,
          paddingTop: embedded ? 8 : 24,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {/* Step 2 header — PRD */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
            Step 2 of 2
          </Text>
          <Text className="text-2xl font-bold text-neutral-900 mb-2">
            Connect to a Startup
          </Text>
          <Text className="text-sm text-neutral-600 leading-6">
            Search for your startup's name. If it's already in the system, select it and
            request to join. If not, you'll set it up as the founder admin.
          </Text>
        </View>

        {isJoinStatusLoading ? (
          <View className="py-4 items-center">
            <LoadingSpinner size="small" />
          </View>
        ) : null}

        <StartupJoinStatusCard state={viewState} />

        {viewState.adminPendingRequests && viewState.adminPendingRequests.length > 0 ? (
          <StartupJoinAdminPanel
            requests={viewState.adminPendingRequests}
            isActing={isActing}
            onApprove={approveRequest}
            onDeny={denyRequest}
          />
        ) : null}

        {/* Pending — can continue using app */}
        {viewState.phase === "pending" && (variant === "onboarding" || onSkip) ? (
          <Pressable
            onPress={() => (onSkip ? onSkip() : void finishFlow())}
            className="mt-2 bg-black rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Continue to app</Text>
          </Pressable>
        ) : null}

        {showConnectForm && screenPhase === "search" ? (
          <View className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <View className="px-4 py-4 border-b border-neutral-100 bg-neutral-50">
              <Text className="text-base font-semibold text-neutral-900">
                Find your startup
              </Text>
              <Text className="text-sm text-neutral-600 mt-1 leading-5">
                Next, search for your startup's name.
              </Text>
            </View>

            <View className="p-4">
              <View className="flex-row items-center bg-neutral-100 border border-neutral-300 rounded-xl px-4 mb-4">
                <SearchIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-base text-neutral-900"
                  placeholder="Search startup name"
                  placeholderTextColor={INPUT_PLACEHOLDER}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {searchError ? (
                <Text className="text-sm text-red-600 mb-3">{searchError}</Text>
              ) : null}

              {isSearching ? (
                <View className="py-6 items-center">
                  <LoadingSpinner size="small" />
                </View>
              ) : results.length === 0 ? (
                <View className="py-4 px-2">
                  <Text className="text-sm text-neutral-600 text-center leading-5">
                    {search.trim()
                      ? "No startups match that name yet."
                      : "Type your startup name to search the directory."}
                  </Text>
                </View>
              ) : (
                <View className="mb-2">
                  {results.map((c) => {
                    const id = Number(c.id);
                    const selected = selectedCompanyId === id;
                    return (
                      <Pressable
                        key={String(c.id)}
                        onPress={() => selectStartup(c)}
                        className={`mb-2 p-4 rounded-xl border flex-row items-center ${
                          selected
                            ? "border-black bg-neutral-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="font-semibold text-neutral-900 text-base">
                            {c.name}
                          </Text>
                          {c.company_sector ? (
                            <Text className="text-sm text-neutral-500 mt-0.5">
                              {c.company_sector}
                            </Text>
                          ) : null}
                        </View>
                        {selected ? (
                          <View className="w-7 h-7 rounded-full bg-black items-center justify-center">
                            <CheckIcon />
                          </View>
                        ) : (
                          <View className="w-7 h-7 rounded-full border-2 border-neutral-300" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable
                onPress={() => void handleRequestJoin()}
                disabled={isSubmitting || !selectedCompanyId}
                className="bg-black rounded-xl py-4 items-center mt-2"
                style={{ opacity: isSubmitting || !selectedCompanyId ? 0.45 : 1 }}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Request to Join
                  </Text>
                )}
              </Pressable>

              <Text className="text-xs text-neutral-500 text-center mt-3 leading-4 px-2">
                Your request goes to the startup admin. You can use the app while it's
                pending — you're not officially linked until they approve.
              </Text>

              <Pressable
                onPress={() => {
                  setScreenPhase("create");
                  if (search.trim() && !startupName.trim()) {
                    setStartupName(search.trim());
                  }
                }}
                className="mt-5 py-3 items-center border-t border-neutral-100"
              >
                <Text className="text-sm text-neutral-600 text-center leading-5">
                  Can't find your startup?{" "}
                  <Text className="font-semibold text-black">
                    Set up a new startup
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {showConnectForm && screenPhase === "create" ? (
          <View>
            <Pressable
              onPress={() => setScreenPhase("search")}
              className="mb-4 flex-row items-center"
            >
              <Text className="text-sm font-medium text-neutral-600">
                ← Back to search
              </Text>
            </Pressable>

            <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 mb-5">
              <Text className="text-base font-semibold text-neutral-900 mb-1">
                Register your startup
              </Text>
              <Text className="text-sm text-neutral-600 leading-5">
                If your startup isn't in the system yet, you'll become the founder who
                sets it up — and automatically become the admin.
              </Text>
            </View>

            <FormSection title="Basics">
              <Field label="Startup name" value={startupName} onChange={setStartupName} required />

              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Logo <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                onPress={() => void pickLogo()}
                className="mb-4 w-28 h-28 rounded-2xl border border-neutral-300 bg-white items-center justify-center overflow-hidden"
              >
                {logoUri ? (
                  <Image source={{ uri: logoUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-xs text-neutral-500 text-center px-2">
                    Tap to add logo
                  </Text>
                )}
              </Pressable>
            </FormSection>

            <FormSection title="About the startup">
              <Field label="The Problem" value={problem} onChange={setProblem} multiline required />
              <Field label="The Solution" value={solution} onChange={setSolution} multiline required />
              <Field
                label="Description of the Startup"
                value={description}
                onChange={setDescription}
                multiline
                required
              />
            </FormSection>

            <FormSection title="Location & links">
              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Country <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 mb-4"
              >
                <Text className="text-base text-neutral-900">{countryLabel}</Text>
              </Pressable>

              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Current growth stage <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                onPress={() => setShowGrowthStageModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 mb-4"
              >
                <Text className="text-base text-neutral-900">{growthStageLabel}</Text>
              </Pressable>

              <Field
                label="Year founded"
                value={yearFounded}
                onChange={setYearFounded}
                required
                keyboardType="number-pad"
                placeholder="e.g. 2021"
              />

              <Field label="Website" value={website} onChange={setWebsite} required />
              <Field label="Pitch deck link" value={pitchDeckUrl} onChange={setPitchDeckUrl} required />

              <Text className="text-sm font-medium text-neutral-700 mb-2">
                Industry <Text className="text-red-500">*</Text>
              </Text>
              <Pressable
                onPress={() => setShowIndustryModal(true)}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 mb-1"
              >
                <Text className="text-base text-neutral-900">{industryLabel}</Text>
              </Pressable>
            </FormSection>

            <FormSection title="Job openings (optional)">
              <Text className="text-xs text-neutral-500 mb-3 leading-4">
                If you add a role, both title and apply link are required.
              </Text>
              {jobOpenings.map((job, index) => (
                <View
                  key={job.id}
                  className="mb-3 p-4 bg-white border border-neutral-200 rounded-xl"
                >
                  <Field
                    label={`Role ${index + 1}`}
                    value={job.title}
                    onChange={(v) =>
                      setJobOpenings((prev) =>
                        prev.map((j) => (j.id === job.id ? { ...j, title: v } : j)),
                      )
                    }
                  />
                  <Field
                    label="Link to apply"
                    value={job.applyUrl}
                    onChange={(v) =>
                      setJobOpenings((prev) =>
                        prev.map((j) => (j.id === job.id ? { ...j, applyUrl: v } : j)),
                      )
                    }
                  />
                </View>
              ))}
              <Pressable
                onPress={() =>
                  setJobOpenings((prev) => [
                    ...prev,
                    { id: nextId(), title: "", applyUrl: "" },
                  ])
                }
                className="py-2"
              >
                <Text className="text-sm font-semibold text-black">+ Add job opening</Text>
              </Pressable>
            </FormSection>

            <View className="mb-5 rounded-2xl border border-neutral-200 overflow-hidden">
              <Pressable
                onPress={() => setFoundersExpanded((prev) => !prev)}
                className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex-row items-center justify-between"
                hitSlop={8}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold text-neutral-800">
                    Founder info
                  </Text>
                  {!foundersExpanded ? (
                    <Text className="text-xs text-neutral-500 mt-1">
                      {founders.length} founder
                      {founders.length === 1 ? "" : "s"} — tap to expand
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    transform: [
                      { rotate: foundersExpanded ? "180deg" : "0deg" },
                    ],
                  }}
                >
                  <ChevronDownIcon size={20} color="#404040" />
                </View>
              </Pressable>
              {foundersExpanded ? (
                <View className="p-4 bg-white">
                  <Text className="text-xs text-neutral-500 mb-3 leading-4">
                    For each founder: photo, name, role, email, and LinkedIn. Email is
                    required by the backend.
                  </Text>
                  {founders.map((founder, index) => (
                    <View
                      key={founder.id}
                      className="mb-3 p-4 bg-white border border-neutral-200 rounded-xl"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-neutral-700">
                          Founder {index + 1} photo
                        </Text>
                        {founders.length > 1 ? (
                          <Pressable
                            onPress={() =>
                              setFounders((prev) =>
                                prev.filter((f) => f.id !== founder.id),
                              )
                            }
                            hitSlop={8}
                          >
                            <Text className="text-xs font-medium text-red-600">
                              Remove
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => void pickFounderPhoto(founder.id)}
                        className="mb-4 w-20 h-20 rounded-full border border-neutral-300 bg-neutral-50 items-center justify-center overflow-hidden self-start"
                      >
                        {founder.imageUri ? (
                          <Image
                            source={{ uri: founder.imageUri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-[10px] text-neutral-500 text-center px-1">
                            Add photo
                          </Text>
                        )}
                      </Pressable>
                      <Field
                        label={`Founder ${index + 1} — Name`}
                        value={founder.name}
                        onChange={(v) =>
                          setFounders((prev) =>
                            prev.map((f) =>
                              f.id === founder.id ? { ...f, name: v } : f,
                            ),
                          )
                        }
                        required
                      />
                      <Field
                        label="Role"
                        value={founder.role}
                        onChange={(v) =>
                          setFounders((prev) =>
                            prev.map((f) =>
                              f.id === founder.id ? { ...f, role: v } : f,
                            ),
                          )
                        }
                        required
                      />
                      <Field
                        label="Email"
                        value={founder.email}
                        onChange={(v) =>
                          setFounders((prev) =>
                            prev.map((f) =>
                              f.id === founder.id ? { ...f, email: v } : f,
                            ),
                          )
                        }
                        required
                        placeholder="founder@startup.com"
                      />
                      <Field
                        label="LinkedIn"
                        value={founder.linkedIn}
                        onChange={(v) =>
                          setFounders((prev) =>
                            prev.map((f) =>
                              f.id === founder.id ? { ...f, linkedIn: v } : f,
                            ),
                          )
                        }
                        required
                      />
                    </View>
                  ))}
                  <Pressable
                    onPress={() => {
                      setFounders((prev) => [
                        ...prev,
                        {
                          id: nextId(),
                          name: "",
                          role: "",
                          email: "",
                          linkedIn: "",
                          imageUri: null,
                        },
                      ]);
                      setFoundersExpanded(true);
                    }}
                    className="py-2 mb-2"
                  >
                    <Text className="text-sm font-semibold text-black">
                      + Add another founder
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => void handleCreateStartup()}
              disabled={isSubmitting}
              className="bg-black rounded-xl py-4 items-center justify-center flex-row mt-2"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create startup & continue
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {showConnectForm && (variant === "onboarding" || onSkip) ? (
          <Pressable
            onPress={() => (onSkip ? onSkip() : void finishFlow())}
            className="mt-6 py-3 items-center"
          >
            <Text className="text-neutral-600 font-medium">Skip for now</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <PickerModal
        visible={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        title="Select industry"
        options={INDUSTRY_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selectedId={selectedIndustry}
        onSelect={setSelectedIndustry}
      />
      <PickerModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        title="Select country"
        options={COUNTRY_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selectedId={selectedCountry}
        onSelect={setSelectedCountry}
      />
      <PickerModal
        visible={showGrowthStageModal}
        onClose={() => setShowGrowthStageModal(false)}
        title="Current growth stage"
        options={GROWTH_STAGE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selectedId={selectedGrowthStage}
        onSelect={setSelectedGrowthStage}
      />
    </KeyboardAvoidingView>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5 rounded-2xl border border-neutral-200 overflow-hidden">
      <View className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
        <Text className="text-sm font-semibold text-neutral-800">{title}</Text>
      </View>
      <View className="p-4 bg-white">{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  required = false,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  keyboardType?: "default" | "number-pad";
  placeholder?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-neutral-700 mb-2">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <TextInput
        className="bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 text-base text-neutral-900"
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={INPUT_PLACEHOLDER}
        maxLength={keyboardType === "number-pad" ? 4 : undefined}
      />
    </View>
  );
}

function PickerModal({
  visible,
  onClose,
  title,
  options,
  selectedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-3xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
            <Text className="text-xl font-bold text-black">{title}</Text>
            <Pressable onPress={onClose} className="p-2">
              <CloseIcon size={20} color="#000000" />
            </Pressable>
          </View>
          <ScrollView className="px-6 pb-8" nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const isSelected = selectedId === option.id;
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
                      isSelected ? "font-semibold text-black" : "font-medium text-neutral-700"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
