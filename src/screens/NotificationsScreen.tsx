import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { StatusBar } from "expo-status-bar";
import NotificationItem from "../components/NotificationItem";
import NotificationDetailModal from "../components/NotificationDetailModal";
import { LoadingSpinner } from "../components";
import {
  CloseIcon,
  ProfileIcon,
  CalendarIcon,
  OffersIcon,
} from "../components/MenuIcons";
import { BellIcon } from "../components/HeaderIcons";
import { ChevronRightIcon } from "../components/MenuIcons";
import { notificationService } from "../services/notificationService";
import { ApiClientError } from "../services/api";
import { mapBackendNotificationToUI, fetchNotificationDetails, type UINotification } from "../utils/notificationUtils";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";

export default function NotificationsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Notifications">>();
  const route = useRoute<RouteProp<RootStackParamList, "Notifications">>();
  const openNotificationId = route.params?.openNotificationId;
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const { showToast, hideToast, toast } = useToast();
  
  // State
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<UINotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  
  // Prevent duplicate calls
  const isFetchingRef = useRef(false);

  /**
   * Fetch notifications from backend
   */
  const fetchNotifications = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await notificationService.getNotifications(
        page,
        PAGE_SIZE,
        "-timestamp" // Order by timestamp descending (latest first)
      );

      const uiNotifications = response.notifications.map((notif) =>
        mapBackendNotificationToUI(notif, user?.user_id)
      );

      if (page === 1) {
        setNotifications(uiNotifications);
      } else {
        setNotifications((prev) => [...prev, ...uiNotifications]);
      }

      // Check if there are more pages
      setHasMore(!!response.pagination.next);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load notifications. Please try again.";
      setError(errorMessage);
      if (page === 1) {
        showToast(errorMessage, "error");
      }
      if (__DEV__) {
        console.error("Error fetching notifications:", err);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [user?.user_id, showToast]);

  /**
   * Load more notifications (infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isFetchingRef.current) {
      fetchNotifications(currentPage + 1, false);
    }
  }, [currentPage, hasMore, isLoadingMore, fetchNotifications]);

  /**
   * Mark notification as read
   * Called when:
   * - User clicks action button in modal (accept/decline)
   * - User navigates to another screen from notification
   */
  const markAsRead = useCallback(async (notification: UINotification) => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, unread: false } : n
      )
    );

    try {
      await notificationService.markAsRead(notification.backendNotificationId);
      await refreshUnreadCount();
    } catch (err: any) {
      // Rollback on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, unread: true } : n
        )
      );
      if (__DEV__) {
        console.error("Error marking notification as read:", err);
      }
    }
  }, [refreshUnreadCount]);

  /**
   * Handle notification press
   */
  const handleNotificationPress = useCallback(async (notification: UINotification) => {
    // For notifications that open modals
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
      // Fetch details before opening modal (lazy loading)
      setIsLoadingDetails(true);
      try {
        const enrichedNotification = await fetchNotificationDetails(
          notification,
          user?.user_id
        );
        setSelectedNotification(enrichedNotification);
      } catch (err: any) {
        if (__DEV__) {
          console.error("Error fetching notification details:", err);
        }
        // Still open modal with basic data
        setSelectedNotification(notification);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      // For notifications that navigate to other screens
      // Mark as read when navigation happens
      await markAsRead(notification);
      
      // Close notifications screen first
      navigation.goBack();

      // Navigate after a short delay
      setTimeout(() => {
        if (notification.route) {
          // Use route field if available
          // Parse route (e.g., "/meetings/123" or "Meetings")
          const routeParts = notification.route.split("/").filter(Boolean);
          if (routeParts.length > 0) {
            const routeName = routeParts[0];
            // Map route to navigation screen
            if (routeName === "meetings" || routeName === "Meetings") {
              navigation.navigate("Meetings", {
                primaryTab: notification.meeting_id ? "scheduled" : "requests",
                secondaryTab: notification.direction || "outbound",
              });
            } else if (routeName === "connections" || routeName === "Connections") {
              navigation.navigate("Connections");
            }
          }
        } else {
          // Fallback: Navigate based on type
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
            default:
              break;
          }
        }
      }, 100);
    }
  }, [markAsRead, navigation, user?.user_id]);

  /**
   * Handle "View profile" - mark as read, close modal, navigate to Connections
   */
  const handleViewProfile = useCallback((notification: UINotification) => {
    markAsRead(notification);
    setSelectedNotification(null);
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate("Connections");
    }, 100);
  }, [markAsRead, navigation]);

  /**
   * Handle "View meeting" - mark as read, close modal, navigate to Meetings
   */
  const handleViewMeeting = useCallback((
    notification: UINotification,
    tab: "requests" | "scheduled" = "requests",
    secondaryTab: "inbound" | "outbound" = "inbound"
  ) => {
    markAsRead(notification);
    setSelectedNotification(null);
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate("Meetings", {
        primaryTab: tab,
        secondaryTab: notification.direction || secondaryTab,
      });
    }, 100);
  }, [markAsRead, navigation]);

  // Refetch when screen gains focus (including first open, and when returning from push)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, false);
      refreshUnreadCount();
    }, [fetchNotifications, refreshUnreadCount])
  );

  // Open specific notification when navigated from push tap (Item 7)
  useEffect(() => {
    if (!openNotificationId || notifications.length === 0) return;
    const match = notifications.find(
      (n) => n.backendNotificationId === openNotificationId,
    );
    if (match) {
      handleNotificationPress(match);
      navigation.setParams({ openNotificationId: undefined });
    }
  }, [openNotificationId, notifications, handleNotificationPress, navigation]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <StatusBar style="dark" />
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5",
          }}
        >
          <Text
            className="font-bold text-neutral-900"
            style={{ fontSize: 24, lineHeight: 32 }}
          >
            Notifications
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2"
            hitSlop={8}
          >
            <CloseIcon size={24} color="#404040" />
          </Pressable>
        </View>

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <LoadingSpinner size="large" />
            <Text className="text-base text-neutral-500 mt-4">
              Loading notifications...
            </Text>
          </View>
        ) : error && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-base text-neutral-500 text-center mb-4">
              {error}
            </Text>
            <Pressable
              onPress={() => fetchNotifications(1, false)}
              className="bg-neutral-900 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#F5F8FF" }}
            >
              <BellIcon size={32} color="#2762C7" />
            </View>
            <Text className="text-lg font-semibold text-neutral-900 mb-2">
              No notifications
            </Text>
            <Text className="text-sm text-neutral-500 text-center mb-4">
              You're all caught up! New notifications will appear here.
            </Text>
            {/* Temporary message - remove when backend creates notifications automatically */}
            {__DEV__ && (
              <View className="mt-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Text className="text-xs text-yellow-800 text-center">
                  Note: Notifications will appear here once the backend creates them automatically for connection requests, meeting requests, etc.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchNotifications(1, true)}
                tintColor="#1BB273"
                colors={["#1BB273"]}
              />
            }
            onScroll={({ nativeEvent }) => {
              // Infinite scroll: Load more when near bottom
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const paddingToBottom = 20;
              if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom
              ) {
                loadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                icon={notification.icon}
                title={notification.title}
                description={notification.description}
                time={notification.time}
                unread={notification.unread}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <View className="py-4 items-center">
                <LoadingSpinner size="small" />
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        visible={
          selectedNotification !== null &&
          (selectedNotification?.type === "meeting_request" ||
            selectedNotification?.type === "meeting_time_change" ||
            selectedNotification?.type === "meeting_approved" ||
            selectedNotification?.type === "meeting_cancelled" ||
            selectedNotification?.type === "meeting_request_sent" ||
            selectedNotification?.type === "connection" ||
            selectedNotification?.type === "connection_request" ||
            selectedNotification?.type === "connection_accepted" ||
            selectedNotification?.type === "generic")
        }
        onClose={() => {
          if (
            selectedNotification?.type === "meeting_cancelled" ||
            selectedNotification?.type === "meeting_request" ||
            selectedNotification?.type === "connection" ||
            selectedNotification?.type === "connection_request" ||
            selectedNotification?.type === "connection_accepted" ||
            selectedNotification?.type === "meeting_request_sent" ||
            selectedNotification?.type === "generic"
          ) {
            markAsRead(selectedNotification);
          }
          setSelectedNotification(null);
        }}
        notification={selectedNotification ? {
          id: selectedNotification.id,
          type: selectedNotification.type as any,
          title: selectedNotification.title,
          requester: selectedNotification.requester ? {
            name: selectedNotification.requester.name,
            role: selectedNotification.requester.role || "",
            company: selectedNotification.requester.company || "",
            avatar: selectedNotification.requester.avatar,
            tags: selectedNotification.requester.tags,
            interests: selectedNotification.requester.interests,
            socialLabel: selectedNotification.requester.socialLabel,
          } : undefined,
          meetingDetails: selectedNotification.meetingDetails,
          reason: selectedNotification.reason,
          cancelledBy: selectedNotification.cancelledBy,
          onAccept: undefined,
          onDecline: undefined,
          onViewMeeting:
            selectedNotification.type === "meeting_request"
              ? () => handleViewMeeting(selectedNotification, "requests", "inbound")
              : selectedNotification.type === "meeting_time_change"
              ? () => handleViewMeeting(selectedNotification, "requests", "inbound")
              : selectedNotification.type === "meeting_approved"
              ? () =>
                  handleViewMeeting(
                    selectedNotification,
                    "scheduled",
                    selectedNotification.direction ?? "outbound"
                  )
              : selectedNotification.type === "meeting_request_sent"
              ? () => handleViewMeeting(selectedNotification, "requests", "outbound")
              : undefined,
          onViewProfile:
            selectedNotification.type === "connection" ||
            selectedNotification.type === "connection_request" ||
            selectedNotification.type === "connection_accepted"
              ? () => handleViewProfile(selectedNotification)
              : undefined,
        } : null}
      />
      
      {/* Loading overlay for details */}
      {isLoadingDetails && (
        <View
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
          <LoadingSpinner size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}
