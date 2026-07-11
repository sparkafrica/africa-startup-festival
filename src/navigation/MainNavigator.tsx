import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";

// Main App Screens
import HomeScreen from "../screens/HomeScreen";
import AttendeesScreen from "../screens/AttendeesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SearchScreen from "../screens/SearchScreen";
import MenuScreen from "../screens/MenuScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import ScannedAttendeeScreen from "../screens/ScannedAttendeeScreen";
import ExhibitorsScreen from "../screens/ExhibitorsScreen";
import CompanyDetailScreen from "../screens/CompanyDetailScreen";
import PartnersScreen from "../screens/PartnersScreen";
import StartupsScreen from "../screens/StartupsScreen";
import SpeakersScreen from "../screens/SpeakersScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import MessagesScreen from "../screens/MessagesScreen";
import MeetingsScreen from "../screens/MeetingsScreen";
import ConnectionsScreen from "../screens/ConnectionsScreen";
import ConversationScreen from "../screens/ConversationScreen";
import ContactScreen from "../screens/ContactScreen";
import TalentBoardScreen from "../screens/TalentBoardScreen";
import PartnersOffersScreen from "../screens/PartnersOffersScreen";
import AppGuideScreen from "../screens/AppGuideScreen";
import TagPickupScreen from "../screens/TagPickupScreen";
const Stack = createNativeStackNavigator<RootStackParamList>();

const FADE = { animation: "fade" as const };
const NONE = { animation: "none" as const };
const MODAL_BOTTOM = {
  presentation: "modal" as const,
  animation: "slide_from_bottom" as const,
};

export default function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={NONE} />
      <Stack.Screen name="Attendees" component={AttendeesScreen} options={NONE} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={FADE} />
      <Stack.Screen name="Search" component={SearchScreen} options={FADE} />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ ...MODAL_BOTTOM, animation: "fade" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={MODAL_BOTTOM}
      />
      <Stack.Screen name="ScanQR" component={ScanQRScreen} options={FADE} />
      <Stack.Screen name="ScannedAttendee" component={ScannedAttendeeScreen} options={FADE} />
      <Stack.Screen name="Exhibitors" component={ExhibitorsScreen} options={FADE} />
      <Stack.Screen
        name="CompanyDetail"
        component={CompanyDetailScreen}
        options={MODAL_BOTTOM}
      />
      <Stack.Screen name="Partners" component={PartnersScreen} options={FADE} />
      <Stack.Screen name="Startups" component={StartupsScreen} options={FADE} />
      <Stack.Screen name="Speakers" component={SpeakersScreen} options={FADE} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} options={NONE} />
      <Stack.Screen name="Meetings" component={MeetingsScreen} options={NONE} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={NONE} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} options={NONE} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={FADE} />
      <Stack.Screen name="Contact" component={ContactScreen} options={FADE} />
      <Stack.Screen name="Talent" component={TalentBoardScreen} options={FADE} />
      <Stack.Screen name="PartnersOffers" component={PartnersOffersScreen} options={FADE} />
      <Stack.Screen name="AppGuide" component={AppGuideScreen} options={FADE} />
      <Stack.Screen name="TagPickup" component={TagPickupScreen} options={FADE} />
    </Stack.Navigator>
  );
}
