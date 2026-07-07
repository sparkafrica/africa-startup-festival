import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import type { JoinRequest } from "../services/joinRequestService";
import { LoadingSpinner } from "./index";

function requesterName(request: JoinRequest): string {
  const first = request.user?.first_name ?? "";
  const last = request.user?.last_name ?? "";
  const full = `${first} ${last}`.trim();
  return full || "Team member";
}

export function StartupJoinAdminPanel({
  requests,
  isActing,
  onApprove,
  onDeny,
}: {
  requests: JoinRequest[];
  isActing?: boolean;
  onApprove: (requestId: number) => Promise<void>;
  onDeny: (requestId: number) => Promise<void>;
}) {
  if (requests.length === 0) return null;

  const confirmDeny = (request: JoinRequest) => {
    Alert.alert(
      "Decline join request?",
      `${requesterName(request)} won't be linked to your startup.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => void onDeny(request.id),
        },
      ],
    );
  };

  return (
    <View className="mb-5 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <View className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <Text className="text-base font-semibold text-neutral-900">
          Pending join requests ({requests.length})
        </Text>
        <Text className="text-xs text-neutral-500 mt-1 leading-4">
          Approve to link them to your startup and add a badge to their profile.
          You'll get reminders every 24 hours until these are handled.
        </Text>
      </View>

      {requests.map((request) => (
        <View
          key={request.id}
          className="px-4 py-4 border-b border-neutral-100 last:border-b-0"
        >
          <Text className="text-sm font-semibold text-neutral-900">
            {requesterName(request)}
          </Text>
          {request.user?.job_title ? (
            <Text className="text-xs text-neutral-500 mt-0.5">
              {request.user.job_title}
            </Text>
          ) : null}
          <View className="flex-row gap-2 mt-3">
            <Pressable
              onPress={() => void onApprove(request.id)}
              disabled={isActing}
              className="flex-1 bg-black rounded-xl py-2.5 items-center"
              style={{ opacity: isActing ? 0.6 : 1 }}
            >
              {isActing ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-semibold">Approve</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => confirmDeny(request)}
              disabled={isActing}
              className="flex-1 border border-neutral-300 rounded-xl py-2.5 items-center bg-white"
              style={{ opacity: isActing ? 0.6 : 1 }}
            >
              <Text className="text-neutral-800 text-sm font-semibold">Decline</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
