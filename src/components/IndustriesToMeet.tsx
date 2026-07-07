import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { CloseIcon } from "./MenuIcons";
import { INDUSTRY_OPTIONS } from "../constants/industryAndInterests";

function ChevronDownIcon({
  size = 20,
  color = "#404040",
  rotated = false,
}: {
  size?: number;
  color?: string;
  rotated?: boolean;
}) {
  return (
    <View style={rotated ? { transform: [{ rotate: "180deg" }] } : undefined}>
      <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <Path
          d="M5 7.5L10 12.5L15 7.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function CloseXIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
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

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: "100%",
  },
  chipSelected: {
    backgroundColor: "#000000",
  },
  chipUnselected: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D4D4D4",
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chipTextUnselected: {
    color: "#262626",
    fontWeight: "400",
  },
});

const IndustryChip = memo(function IndustryChip({
  label,
  isSelected,
  atMax,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  atMax: boolean;
  onPress: (label: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (!atMax) onPress(label);
  }, [atMax, label, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={atMax}
      style={[
        chipStyles.chip,
        isSelected ? chipStyles.chipSelected : chipStyles.chipUnselected,
        atMax ? chipStyles.chipDisabled : null,
      ]}
    >
      <Text
        style={[
          chipStyles.chipText,
          isSelected ? chipStyles.chipTextSelected : chipStyles.chipTextUnselected,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const SelectedChip = memo(function SelectedChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: (label: string) => void;
}) {
  const handleRemove = useCallback(() => onRemove(label), [label, onRemove]);

  return (
    <Pressable
      onPress={handleRemove}
      className="flex-row items-center bg-black rounded-full px-3 py-1.5"
    >
      <Text className="text-white text-xs font-medium mr-1.5" numberOfLines={1}>
        {label}
      </Text>
      <CloseXIcon size={12} color="#FFFFFF" />
    </Pressable>
  );
});

export const IndustriesToMeetModal = memo(function IndustriesToMeetModal({
  visible,
  onClose,
  selected,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [showSelected, setShowSelected] = useState(true);

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setShowSelected(true);
    }
  }, [visible, selected]);

  const selectedSet = useMemo(() => new Set(draft), [draft]);
  const atMax = draft.length >= 12;

  const toggleDraft = useCallback((label: string) => {
    setDraft((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      if (prev.length >= 12) return prev;
      return [...prev, label];
    });
  }, []);

  const handleDone = useCallback(() => {
    onChange(draft);
    onClose();
  }, [draft, onChange, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: "85%" }}
        >
          <View className="items-center pt-2 pb-1">
            <View className="w-12 h-1 bg-neutral-300 rounded-full" />
          </View>

          <View className="px-5 pb-6">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xl font-bold text-black">
                Industries to meet
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <CloseIcon size={20} color="#000000" />
              </Pressable>
            </View>
            <Text className="text-sm text-neutral-500 mb-4">
              Select 5–12 ({draft.length}/12)
            </Text>

            {draft.length > 0 ? (
              <View className="mb-4 border border-neutral-200 rounded-xl overflow-hidden">
                <Pressable
                  onPress={() => setShowSelected((prev) => !prev)}
                  className="flex-row items-center justify-between px-4 py-3 bg-neutral-50"
                >
                  <Text className="text-sm font-medium text-neutral-800">
                    Selected ({draft.length})
                  </Text>
                  <ChevronDownIcon size={18} color="#404040" rotated={showSelected} />
                </Pressable>
                {showSelected ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      gap: 8,
                    }}
                    style={{ maxHeight: 52 }}
                  >
                    {draft.map((label) => (
                      <SelectedChip
                        key={label}
                        label={label}
                        onRemove={toggleDraft}
                      />
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            ) : null}

            <Text className="text-sm font-medium text-neutral-700 mb-3">
              All industries
            </Text>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {INDUSTRY_OPTIONS.map((option) => (
                  <IndustryChip
                    key={option.id}
                    label={option.label}
                    isSelected={selectedSet.has(option.label)}
                    atMax={atMax && !selectedSet.has(option.label)}
                    onPress={toggleDraft}
                  />
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={handleDone}
              className="bg-black rounded-xl py-3.5 items-center mt-4"
            >
              <Text className="text-white font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export function IndustriesToMeetField({
  selected,
  expanded,
  onToggleExpanded,
  onOpenModal,
  onRemove,
  hasError,
  inputClassName = "bg-neutral-100",
}: {
  selected: string[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenModal: () => void;
  onRemove: (label: string) => void;
  hasError?: boolean;
  inputClassName?: string;
}) {
  const preview = selected.slice(0, 2).join(", ");
  const remaining = selected.length - 2;

  return (
    <View>
      <Pressable
        onPress={onOpenModal}
        className={`${inputClassName} border rounded-xl px-4 py-3 flex-row items-center justify-between ${
          hasError ? "border-red-500" : "border-neutral-300"
        }`}
      >
        <View className="flex-1 pr-3">
          <Text
            className={`text-base ${
              selected.length > 0 ? "text-neutral-900 font-medium" : "text-neutral-500"
            }`}
            numberOfLines={1}
          >
            {selected.length > 0
              ? `${selected.length} industr${selected.length === 1 ? "y" : "ies"} selected`
              : "Tap to select industries"}
          </Text>
          {selected.length > 0 && !expanded ? (
            <Text className="text-xs text-neutral-500 mt-1" numberOfLines={1}>
              {preview}
              {remaining > 0 ? ` +${remaining} more` : ""}
            </Text>
          ) : null}
        </View>
        <ChevronDownIcon size={20} color="#404040" />
      </Pressable>

      {selected.length > 0 ? (
        <View className="mt-2 border border-neutral-200 rounded-xl overflow-hidden">
          <Pressable
            onPress={onToggleExpanded}
            className="flex-row items-center justify-between px-3 py-2.5 bg-neutral-50"
          >
            <Text className="text-xs font-medium text-neutral-600">
              {expanded ? "Hide selected" : "Show selected"}
            </Text>
            <ChevronDownIcon size={16} color="#737373" rotated={expanded} />
          </Pressable>
          {expanded ? (
            <View className="px-3 py-3 flex-row flex-wrap gap-2">
              {selected.map((label) => (
                <View
                  key={label}
                  className="flex-row items-center bg-neutral-900 rounded-full pl-3 pr-1.5 py-1.5 max-w-full"
                >
                  <Text
                    className="text-white text-xs font-medium mr-1 flex-shrink"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  <Pressable
                    onPress={() => onRemove(label)}
                    hitSlop={8}
                    className="w-5 h-5 items-center justify-center"
                  >
                    <CloseXIcon size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
