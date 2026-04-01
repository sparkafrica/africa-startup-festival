/**
 * Optional diagnostic strip for Pusher + API alignment (OTA-friendly via EXPO_PUBLIC_PUSHER_DEBUG_BANNER).
 */

import React, { useEffect, useState } from "react";
import { View, Text, Platform, StatusBar, Pressable } from "react-native";
import * as Updates from "expo-updates";
import {
  APP_ENVIRONMENT,
  ENV,
  PUSHER_API_KEY,
  PUSHER_CLUSTER,
  SHOW_PUSHER_DEBUG_BANNER,
} from "../config/env";
import { addPusherConnectionStateListener } from "../services/pusherChatService";

export default function PusherDebugBanner() {
  const [pusherState, setPusherState] = useState<string>("…");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return addPusherConnectionStateListener((current) => {
      setPusherState(String(current ?? "unknown"));
    });
  }, []);

  if (!SHOW_PUSHER_DEBUG_BANNER) return null;

  const topPad =
    Platform.OS === "android"
      ? (StatusBar.currentHeight ?? 0) + 4
      : 48;

  const keyPrefix =
    PUSHER_API_KEY.length > 10
      ? `${PUSHER_API_KEY.slice(0, 8)}…`
      : PUSHER_API_KEY;

  const apiHost = ENV.BASE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const updateLabel = Updates.isEnabled
    ? Updates.updateId
      ? `OTA ${Updates.updateId.slice(0, 10)}…`
      : "OTA embedded"
    : "no OTA";

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        paddingTop: topPad,
        pointerEvents: "box-none",
      }}
    >
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        style={{
          backgroundColor: "rgba(234, 179, 8, 0.95)",
          borderBottomWidth: 1,
          borderBottomColor: "#ca8a04",
          paddingHorizontal: 10,
          paddingVertical: collapsed ? 4 : 6,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#422006" }}>
          Pusher debug {collapsed ? "(tap expand)" : "(tap collapse)"}
        </Text>
        {!collapsed && (
          <>
            <Text style={{ fontSize: 10, color: "#713f12", marginTop: 2 }}>
              env={APP_ENVIRONMENT} · ws={pusherState} · cluster={PUSHER_CLUSTER}{" "}
              · key={keyPrefix}
            </Text>
            <Text style={{ fontSize: 10, color: "#713f12", marginTop: 1 }}>
              api={apiHost} · {updateLabel}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
