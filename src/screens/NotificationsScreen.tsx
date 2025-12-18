import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { StatusBar } from "expo-status-bar";
import NotificationItem from "../components/NotificationItem";
import NotificationDetailModal from "../components/NotificationDetailModal";
import { CloseIcon, ProfileIcon, CalendarIcon, OffersIcon } from "../components/MenuIcons";
import { BellIcon } from "../components/HeaderIcons";
import { ChevronRightIcon } from "../components/MenuIcons";

export default function NotificationsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Notifications">>();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "meeting_time_change",
      icon: (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <CalendarIcon size={24} color="#F97316" />
        </View>
      ),
      title: "Meeting Time Change Request",
      description: "Sarah Johnson wants to reschedule",
      time: "1 hour ago",
      unread: true,
      requester: {
        name: "Sarah Johnson",
        role: "VC Partner",
        company: "TechVentures Inc",
        avatar: { uri: "https://i.pravatar.cc/150?img=1" },
      },
      meetingDetails: {
        title: "Product Discussion",
        originalTime: "March 15 • 10:00 AM - 10:20 AM",
        newTime: "March 16 • 4:00 PM - 4:20 PM",
      },
      reason:
        "I have a conflicting session at the original time. Would 4 PM tomorrow work better for you?",
      onAccept: () => console.log("Meeting time change accepted"),
      onDecline: () => console.log("Meeting time change declined"),
    },
    {
      id: "2",
      type: "meeting_approved",
      icon: (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <CalendarIcon size={24} color="#1BB273" />
        </View>
      ),
      title: "Meeting Request Approved",
      description: "Sarah Johnson approved your meeting request for March 15",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: "3",
      type: "connection",
      icon: (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      ),
      title: "New Connection",
      description: "Michael Chen accepted your connection request",
      time: "5 hours ago",
      unread: false,
    },
    {
      id: "4",
      type: "reminder",
      icon: (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <BellIcon size={24} color="#F97316" />
        </View>
      ),
      title: "Meeting Reminder",
      description: "You have a meeting with Emma Rodriguez in 30 minutes",
      time: "Yesterday",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

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
        {notifications.length === 0 ? (
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
            <Text className="text-sm text-neutral-500 text-center">
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                icon={notification.icon}
                title={notification.title}
                description={notification.description}
                time={notification.time}
                unread={notification.unread}
                onPress={() => {
                  if (notification.unread) {
                    markAsRead(notification.id);
                  }
                  
                  // Only show modal for meeting time change requests
                  if (notification.type === "meeting_time_change") {
                    setSelectedNotification(notification);
                  } else {
                    // Close the notifications modal first, then navigate
                    navigation.goBack();
                    
                    // Use setTimeout to ensure modal closes before navigation
                    setTimeout(() => {
                      // Navigate to appropriate screen based on notification type
                      switch (notification.type) {
                        case "meeting_approved":
                          navigation.navigate("Schedule");
                          break;
                        case "connection":
                          navigation.navigate("Connections");
                          break;
                        case "reminder":
                          navigation.navigate("Schedule");
                          break;
                        default:
                          // For any other types, just mark as read
                          break;
                      }
                    }, 100);
                  }
                }}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Notification Detail Modal - Only for meeting time change requests */}
      <NotificationDetailModal
        visible={selectedNotification !== null && selectedNotification?.type === "meeting_time_change"}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
      />
    </View>
  );
}

