import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { StatusBar } from "expo-status-bar";
import NotificationItem from "../components/NotificationItem";
import { CloseIcon, ProfileIcon, CalendarIcon, OffersIcon } from "../components/MenuIcons";
import { BellIcon } from "../components/HeaderIcons";

export default function NotificationsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Notifications">>();

  const notifications = [
    {
      id: "1",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      ),
      title: "New meeting request",
      description: "Sarah Johnson wants to schedule a 20-minute meeting with you.",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: "2",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <CalendarIcon size={24} color="#1BB273" />
        </View>
      ),
      title: "Session reminder",
      description: "Your session 'Building Scalable APIs' starts in 15 minutes.",
      time: "5 minutes ago",
      unread: true,
    },
    {
      id: "3",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#F3E8FF" }}
        >
          <OffersIcon size={24} color="#9333EA" />
        </View>
      ),
      title: "New partner offer",
      description: "Get 20% off on EasyTax premium plans. Limited time offer!",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: "4",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      ),
      title: "Meeting confirmed",
      description: "Your meeting with Alex Brown has been confirmed for 3:00 PM.",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: "5",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <BellIcon size={24} color="#F97316" />
        </View>
      ),
      title: "Event update",
      description: "New exhibitor added: Quantum². Check out their booth!",
      time: "3 hours ago",
      unread: false,
    },
    {
      id: "6",
      icon: (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      ),
      title: "Connection request",
      description: "Michael Chen wants to connect with you.",
      time: "5 hours ago",
      unread: false,
    },
  ];

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
              onPress={() => console.log("Notification pressed:", notification.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

