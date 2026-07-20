import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { CalendarIconWhite } from "./SocialIcons";
import LoadingSpinner from "./LoadingSpinner";
import ScheduleBadge from "./ScheduleBadge";
import type { ScheduleBadgeColor } from "../utils/scheduleMetadata";

export interface EventCardProps {
  title: string;
  stage: string;
  day: string;
  startTime: string;
  endTime: string;
  sessionBadge?: {
    label: string;
    color?: ScheduleBadgeColor;
  };
  sponsoredBy?: {
    name: string;
    color?: ScheduleBadgeColor;
  };
  onAddToSchedule?: () => void;
  onLeaveFeedback?: () => void;
  onRemoveFromSchedule?: () => void; // For My Schedule tab
  /** Tap title / meta to open session detail — keeps CTAs separate (no nested press). */
  onOpenDetail?: () => void;
  isInMySchedule?: boolean; // Show "Added" when true
  isAddingToSchedule?: boolean;
  /** Session starts within ~60 min or is live now. */
  happeningSoon?: boolean;
}

function EventCard({
  title,
  stage,
  day,
  startTime,
  endTime,
  sessionBadge,
  sponsoredBy,
  onAddToSchedule,
  onLeaveFeedback,
  onRemoveFromSchedule,
  onOpenDetail,
  isInMySchedule,
  isAddingToSchedule = false,
  happeningSoon = false,
}: EventCardProps) {
  const showActions =
    !!onRemoveFromSchedule ||
    !!onAddToSchedule ||
    !!onLeaveFeedback ||
    !!isInMySchedule;

  const hasBadgeAboveSession = happeningSoon;
  const hasBadgeAboveSponsor = happeningSoon || !!sessionBadge;

  return (
    <View
      className="bg-white p-4 mb-4 border border-gray-100"
      style={{ borderRadius: 0 }}
    >
      <Pressable
        onPress={onOpenDetail}
        disabled={!onOpenDetail}
        accessibilityRole={onOpenDetail ? "button" : undefined}
        className="w-full items-start"
        style={({ pressed }) => ({
          opacity: onOpenDetail && pressed ? 0.75 : 1,
        })}
      >
        {(happeningSoon || sessionBadge || sponsoredBy) && (
          <View className="mb-2 w-full items-start">
            {happeningSoon ? (
              <View
                className="bg-[#1BB273] px-2.5 py-1"
                style={{ borderRadius: 0 }}
              >
                <Text className="text-[11px] font-semibold text-white">
                  Starting soon
                </Text>
              </View>
            ) : null}
            {sessionBadge ? (
              <View
                style={
                  hasBadgeAboveSession ? badgeStackSpacing.afterFirstPill : undefined
                }
              >
                <ScheduleBadge
                  text={sessionBadge.label}
                  color={sessionBadge.color}
                  className="mb-0"
                />
              </View>
            ) : null}
            {sponsoredBy ? (
              <View
                style={
                  hasBadgeAboveSponsor ? badgeStackSpacing.afterFirstPill : undefined
                }
              >
                <ScheduleBadge
                  text={`Sponsored by ${sponsoredBy.name}`}
                  color={sponsoredBy.color}
                  className="mb-0"
                />
              </View>
            ) : null}
          </View>
        )}

        <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
        <Text className="text-sm text-gray-500 mb-4">
          {stage} · {day} · {startTime} - {endTime}
        </Text>
      </Pressable>

      {showActions ? (
      <View className="flex-row items-center gap-3">
        {onRemoveFromSchedule ? (
          <Pressable
            onPress={onRemoveFromSchedule}
            className="flex-row items-center px-4 py-2.5 border border-red-500"
            style={{ borderRadius: 0 }}
          >
            <Text className="text-red-500 font-medium text-sm">Remove from schedule</Text>
          </Pressable>
        ) : isInMySchedule ? (
          <View
            className="flex-row items-center bg-neutral-200 px-4 py-2.5"
            style={{ borderRadius: 0 }}
          >
            <CalendarIconWhite size={16} color="#737373" />
            <Text className="text-neutral-500 font-medium text-sm ml-2">Added</Text>
          </View>
        ) : onAddToSchedule ? (
          <Pressable
            onPress={onAddToSchedule}
            disabled={isAddingToSchedule}
            className={`flex-row items-center px-4 py-2.5 ${
              isAddingToSchedule ? "bg-neutral-700" : "bg-black"
            }`}
            style={{ borderRadius: 0 }}
          >
            {isAddingToSchedule ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <CalendarIconWhite size={16} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium text-sm ml-2">
              {isAddingToSchedule ? "Adding…" : "Add to schedule"}
            </Text>
          </Pressable>
        ) : null}

        {onLeaveFeedback ? (
        <Pressable
          onPress={onLeaveFeedback}
          className="px-3 py-2.5 bg-neutral-50 border border-neutral-300"
          style={{ borderRadius: 0 }}
        >
          <Text className="text-gray-800 text-sm">Leave a Feedback</Text>
        </Pressable>
        ) : null}
      </View>
      ) : null}
    </View>
  );
}

/** Gap between stacked schedule pills (Starting soon + sponsor/session badges). */
const badgeStackSpacing = {
  afterFirstPill: { marginTop: 4 },
} as const;

export default memo(EventCard);
