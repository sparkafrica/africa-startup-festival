import React from "react";
import { View, Text } from "react-native";
import type { StartupJoinViewState } from "../utils/startupJoinStatus";
import { StartupBadge } from "./StartupBadge";

function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StartupJoinStatusCard({
  state,
}: {
  state: StartupJoinViewState;
}) {
  if (state.phase === "unlinked") return null;

  if (state.phase === "pending") {
    return (
      <View className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
        <Text className="text-base font-semibold text-amber-900 mb-1">
          Request pending
        </Text>
        <Text className="text-sm text-amber-800 leading-5">
          Your request to join{" "}
          <Text className="font-semibold">{state.companyName || "this startup"}</Text>{" "}
          is waiting for admin approval. You can use the app right away — you're not
          officially linked to any startup until they approve. Once approved, you'll get
          a startup badge on your profile.
        </Text>
        {state.myRequest?.created_at ? (
          <Text className="text-xs text-amber-700 mt-2">
            Sent {formatRelativeTime(state.myRequest.created_at)}
          </Text>
        ) : null}
      </View>
    );
  }

  if (state.phase === "denied") {
    return (
      <View className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
        <Text className="text-base font-semibold text-red-900 mb-1">
          Join request declined
        </Text>
        <Text className="text-sm text-red-800 leading-5">
          Your request to join{" "}
          <Text className="font-semibold">{state.companyName || "the startup"}</Text>{" "}
          was declined. You can search for another startup or create a new one below.
        </Text>
      </View>
    );
  }

  if (state.phase === "linked" && state.badge) {
    return (
      <View className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
        <View className="flex-row items-center flex-wrap gap-2 mb-2">
          <Text className="text-base font-semibold text-neutral-900">
            Linked to startup
          </Text>
          <StartupBadge companyName={state.badge.companyName} />
        </View>
        <Text className="text-sm text-neutral-600 leading-5">
          {state.isStartupAdmin
            ? "You're the admin for this startup. Keep your startup profile up to date below."
            : "You're verified with this startup. Your profile shows a startup badge, but you'll still appear as a regular attendee in the directory."}
        </Text>
      </View>
    );
  }

  return null;
}
