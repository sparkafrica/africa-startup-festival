/**
 * When the user taps an FCM notification, we reset the stack to Home and pass
 * openPushNotificationId / openAppUpdateFromPush. This host shows the same
 * NotificationDetailModal as the Notifications screen without navigating there first.
 * In-app: user opens Notifications and taps a row — unchanged (handled on NotificationsScreen).
 */
import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import NotificationDetailModal from "./NotificationDetailModal";
import { SkeletonListRows } from "./Skeleton";
import Toast from "./Toast";
import { notificationService } from "../services/notificationService";
import {
  mapBackendNotificationToUI,
  fetchNotificationDetails,
  buildAppUpdateUINotification,
  type UINotification,
} from "../utils/notificationUtils";
import { openPlatformAppStore } from "../utils/openAppStore";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useToast } from "../hooks/useToast";
import { EVENT_ID } from "../config/env";

const FETCH_PAGE_SIZE = 50;
const MAX_PAGES = 40;

async function findUINotificationByBackendId(
  backendId: number,
  userId: string | undefined
): Promise<UINotification | null> {
  let page = 1;
  for (; page <= MAX_PAGES; page++) {
    const response = await notificationService.getNotifications(
      page,
      FETCH_PAGE_SIZE,
      "-timestamp"
    );
    const uiList = response.notifications.map((n) =>
      mapBackendNotificationToUI(n, userId)
    );
    const match = uiList.find((n) => n.backendNotificationId === backendId);
    if (match) return match;
    if (!response.pagination.next) break;
  }
  return null;
}

export default function HomePushNotificationOverlay() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();
  const openPushNotificationId = route.params?.openPushNotificationId;
  const openAppUpdateFromPush = route.params?.openAppUpdateFromPush;

  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const { showToast, hideToast, toast } = useToast();

  const [selectedNotification, setSelectedNotification] =
    useState<UINotification | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const clearPushParams = useCallback(() => {
    navigation.setParams({
      openPushNotificationId: undefined,
      openAppUpdateFromPush: undefined,
    });
  }, [navigation]);

  const markAsRead = useCallback(
    async (notification: UINotification) => {
      try {
        if (notification.backendNotificationId > 0) {
          await notificationService.markAsRead(notification.backendNotificationId);
        }
        await refreshUnreadCount();
      } catch {
        if (__DEV__) {
          console.warn("HomePushNotificationOverlay: markAsRead failed");
        }
      }
    },
    [refreshUnreadCount]
  );

  const openNotificationFromPush = useCallback(
    async (notification: UINotification) => {
      if (notification.type === "chat_message") {
        await markAsRead(notification);
        clearPushParams();
        const cid = notification.conversation_id;
        if (cid && /^\d+$/.test(cid)) {
          const conversationId = parseInt(cid, 10);
          const eid = notification.event_id;
          const eventId =
            eid && /^\d+$/.test(eid) ? parseInt(eid, 10) : EVENT_ID;
          navigation.navigate("Messages", {
            openConversationId: conversationId,
            eventId,
            otherPartyName: notification.chatOtherPartyName ?? "Chat",
          });
        } else {
          navigation.navigate("Messages");
        }
        return;
      }

      if (notification.type === "book_meeting_prompt") {
        await markAsRead(notification);
        clearPushParams();
        navigation.navigate("Attendees");
        return;
      }

      if (notification.type === "app_update") {
        setSelectedNotification(notification);
        return;
      }

      if (
        notification.type === "meeting_request" ||
        notification.type === "meeting_time_change" ||
        notification.type === "meeting_approved" ||
        notification.type === "meeting_cancelled" ||
        notification.type === "meeting_request_sent" ||
        notification.type === "connection" ||
        notification.type === "connection_request" ||
        notification.type === "connection_accepted" ||
        notification.type === "generic"
      ) {
        setIsLoadingDetails(true);
        try {
          const enriched = await fetchNotificationDetails(
            notification,
            user?.user_id
          );
          setSelectedNotification(enriched);
        } catch {
          setSelectedNotification(notification);
        } finally {
          setIsLoadingDetails(false);
        }
        return;
      }

      await markAsRead(notification);
      clearPushParams();
      setTimeout(() => {
        if (notification.route) {
          const routeParts = notification.route.split("/").filter(Boolean);
          if (routeParts.length > 0) {
            const routeName = routeParts[0];
            if (routeName === "meetings" || routeName === "Meetings") {
              navigation.navigate("Meetings", {
                primaryTab: notification.meeting_id ? "scheduled" : "requests",
                secondaryTab: notification.direction || "outbound",
              });
            } else if (
              routeName === "connections" ||
              routeName === "Connections"
            ) {
              navigation.navigate("Connections");
            } else if (
              routeName === "attendees" ||
              routeName === "Attendees"
            ) {
              navigation.navigate("Attendees");
            } else if (
              routeName.toLowerCase() === "schedule"
            ) {
              navigation.navigate("Schedule");
            } else if (
              routeName.toLowerCase() === "tag-pickup"
            ) {
              navigation.navigate("TagPickup");
            }
          }
        } else {
          switch (notification.type) {
            case "meeting_approved":
            case "reminder":
              navigation.navigate("Meetings", {
                primaryTab: "scheduled",
                secondaryTab: notification.direction || "outbound",
              });
              break;
            case "connection":
              navigation.navigate("Connections");
              break;
            case "book_meeting_prompt":
              navigation.navigate("Attendees");
              break;
            default:
              break;
          }
        }
      }, 100);
    },
    [clearPushParams, markAsRead, navigation, user?.user_id]
  );

  useEffect(() => {
    if (!openAppUpdateFromPush) return;
    const n = buildAppUpdateUINotification({
      title: openAppUpdateFromPush.title,
      description: openAppUpdateFromPush.description,
      backendNotificationId: openAppUpdateFromPush.notificationId,
      storeUrl: openAppUpdateFromPush.storeUrl,
    });
    setSelectedNotification(n);
    clearPushParams();
  }, [openAppUpdateFromPush, clearPushParams]);

  useEffect(() => {
    if (openPushNotificationId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const match = await findUINotificationByBackendId(
          openPushNotificationId,
          user?.user_id
        );
        if (cancelled) return;
        if (match) {
          await openNotificationFromPush(match);
          clearPushParams();
        } else {
          showToast("Could not load that notification.", "error");
          clearPushParams();
        }
      } catch {
        if (!cancelled) {
          showToast("Could not load that notification.", "error");
          clearPushParams();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openPushNotificationId, user?.user_id, openNotificationFromPush, clearPushParams, showToast]);

  const handleViewProfile = useCallback(
    (notification: UINotification) => {
      markAsRead(notification);
      setSelectedNotification(null);
      navigation.navigate("Connections");
    },
    [markAsRead, navigation]
  );

  const handleViewMeeting = useCallback(
    (
      notification: UINotification,
      tab: "requests" | "scheduled" = "requests",
      secondaryTab: "inbound" | "outbound" = "inbound"
    ) => {
      markAsRead(notification);
      setSelectedNotification(null);
      navigation.navigate("Meetings", {
        primaryTab: tab,
        secondaryTab: notification.direction || secondaryTab,
      });
    },
    [markAsRead, navigation]
  );

  const handleViewAllocation = useCallback(
    (notification: UINotification) => {
      markAsRead(notification);
      setSelectedNotification(null);
      navigation.navigate("ScanQR", { initialTab: "My Ticket" });
    },
    [markAsRead, navigation]
  );

  const modalVisible =
    selectedNotification !== null &&
    (selectedNotification?.type === "meeting_request" ||
      selectedNotification?.type === "meeting_time_change" ||
      selectedNotification?.type === "meeting_approved" ||
      selectedNotification?.type === "meeting_cancelled" ||
      selectedNotification?.type === "meeting_request_sent" ||
      selectedNotification?.type === "connection" ||
      selectedNotification?.type === "connection_request" ||
      selectedNotification?.type === "connection_accepted" ||
      selectedNotification?.type === "ticket_allocation_accepted" ||
      selectedNotification?.type === "ticket_allocation_declined" ||
      selectedNotification?.type === "app_update" ||
      selectedNotification?.type === "generic");

  return (
    <>
      <NotificationDetailModal
        visible={modalVisible}
        onClose={() => {
          if (
            selectedNotification?.type === "meeting_cancelled" ||
            selectedNotification?.type === "meeting_request" ||
            selectedNotification?.type === "connection" ||
            selectedNotification?.type === "connection_request" ||
            selectedNotification?.type === "connection_accepted" ||
            selectedNotification?.type === "meeting_request_sent" ||
            selectedNotification?.type === "ticket_allocation_accepted" ||
            selectedNotification?.type === "ticket_allocation_declined" ||
            selectedNotification?.type === "app_update" ||
            selectedNotification?.type === "generic"
          ) {
            markAsRead(selectedNotification);
          }
          setSelectedNotification(null);
        }}
        notification={
          selectedNotification
            ? {
                id: selectedNotification.id,
                type: selectedNotification.type as any,
                title: selectedNotification.title,
                description: selectedNotification.description,
                requester: selectedNotification.requester
                  ? {
                      name: selectedNotification.requester.name,
                      role: selectedNotification.requester.role || "",
                      company: selectedNotification.requester.company || "",
                      avatar: selectedNotification.requester.avatar,
                      tags: selectedNotification.requester.tags,
                      interests: selectedNotification.requester.interests,
                      socialLabel: selectedNotification.requester.socialLabel,
                    }
                  : undefined,
                meetingDetails: selectedNotification.meetingDetails,
                reason: selectedNotification.reason,
                cancelledBy: selectedNotification.cancelledBy,
                onAccept: undefined,
                onDecline: undefined,
                onViewAllocation:
                  selectedNotification.type === "ticket_allocation_accepted" ||
                  selectedNotification.type === "ticket_allocation_declined"
                    ? () => handleViewAllocation(selectedNotification)
                    : undefined,
                onViewMeeting:
                  selectedNotification.type === "meeting_request"
                    ? () =>
                        handleViewMeeting(
                          selectedNotification,
                          "requests",
                          "inbound"
                        )
                    : selectedNotification.type === "meeting_time_change"
                      ? () =>
                          handleViewMeeting(
                            selectedNotification,
                            "requests",
                            "inbound"
                          )
                      : selectedNotification.type === "meeting_approved"
                        ? () =>
                            handleViewMeeting(
                              selectedNotification,
                              "scheduled",
                              selectedNotification.direction ?? "outbound"
                            )
                        : selectedNotification.type === "meeting_request_sent"
                          ? () =>
                              handleViewMeeting(
                                selectedNotification,
                                "requests",
                                "outbound"
                              )
                          : undefined,
                onViewProfile:
                  selectedNotification.type === "connection" ||
                  selectedNotification.type === "connection_request" ||
                  selectedNotification.type === "connection_accepted"
                    ? () => handleViewProfile(selectedNotification)
                    : undefined,
                onOpenAppStore:
                  selectedNotification.type === "app_update"
                    ? async () => {
                        await openPlatformAppStore(
                          selectedNotification.appStoreUrlOverride ?? undefined
                        );
                      }
                    : undefined,
              }
            : null
        }
      />

      {isLoadingDetails && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View className="bg-white rounded-2xl p-4 w-[85%]">
            <SkeletonListRows count={2} />
          </View>
        </View>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
    </>
  );
}
