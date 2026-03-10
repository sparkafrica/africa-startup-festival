import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Updates from "expo-updates";
import type { RootStackParamList } from "./types";

// Main App Screens
import HomeScreen from "../screens/HomeScreen";
import AttendeesScreen from "../screens/AttendeesScreen";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import TicketScreen from "../screens/TicketScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SearchScreen from "../screens/SearchScreen";
import MenuScreen from "../screens/MenuScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import ScannedAttendeeScreen from "../screens/ScannedAttendeeScreen";
import ExhibitorsScreen from "../screens/ExhibitorsScreen";
import CompanyDetailScreen from "../screens/CompanyDetailScreen";
import PartnersScreen from "../screens/PartnersScreen";
import SpeakersScreen from "../screens/SpeakersScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import MeetingsScreen from "../screens/MeetingsScreen";
import ConnectionsScreen from "../screens/ConnectionsScreen";
import ContactScreen from "../screens/ContactScreen";
import TalentBoardScreen from "../screens/TalentBoardScreen";
import PartnersOffersScreen from "../screens/PartnersOffersScreen";
import AppGuideScreen from "../screens/AppGuideScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  // Check for OTA updates only after user is authenticated (avoids overlap with login/verification flow)
  useEffect(() => {
    if (__DEV__) return;
    const runUpdateCheck = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
      } catch {
        // Silently ignore update check failures
      }
    };
    runUpdateCheck();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          // animation: "slide_from_right", // Commented out - instant render per project lead (no L/R slide)
          animation: "none",
        }}
      />
      <Stack.Screen
        name="Attendees"
        component={AttendeesScreen}
        options={{
          headerShown: false,
          // animation: "slide_from_right", // Commented out - instant render per project lead (no L/R slide)
          animation: "none",
        }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Ticket"
        component={TicketScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="ScanQR"
        component={ScanQRScreen}
        options={{
          headerShown: false,
          animation: "slide_from_left",
        }}
      />
      <Stack.Screen
        name="ScannedAttendee"
        component={ScannedAttendeeScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Exhibitors"
        component={ExhibitorsScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="CompanyDetail"
        component={CompanyDetailScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="Partners"
        component={PartnersScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Speakers"
        component={SpeakersScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          headerShown: false,
          // animation: "slide_from_right", // Commented out - instant render per project lead (no L/R slide)
          animation: "none",
        }}
      />
      <Stack.Screen
        name="Meetings"
        component={MeetingsScreen}
        options={{
          headerShown: false,
          // animation: "slide_from_right", // Commented out - instant render per project lead (no L/R slide)
          animation: "none",
        }}
      />
      <Stack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          headerShown: false,
          // animation: "slide_from_right", // Commented out - instant render per project lead (no L/R slide)
          animation: "none",
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Talent"
        component={TalentBoardScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="PartnersOffers"
        component={PartnersOffersScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="AppGuide"
        component={AppGuideScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
}
