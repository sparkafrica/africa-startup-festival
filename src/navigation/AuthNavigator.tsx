import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import VerificationCodeScreen from "../screens/VerificationCodeScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import CompleteProfileScreen from "../screens/CompleteProfileScreen";
import ProfileCreatedScreen from "../screens/ProfileCreatedScreen";
import ProfileScreen from "../screens/ProfileScreen";
// import ApiTestScreen from "../screens/ApiTestScreen"; // Temporary - remove before production

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AuthNavigator - Handles authentication flow
 *
 * Flow:
 * - Login (email entry) → VerificationCode screen
 * - After code verification → Welcome (tickets) → Profile completion → Main App
 */
export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerificationCode"
        component={VerificationCodeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileCreated"
        component={ProfileCreatedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      {/* Temporary test screen - remove before production */}
      {/* <Stack.Screen
        name="ApiTest"
        component={ApiTestScreen}
        options={{ headerShown: false }}
      /> */}
    </Stack.Navigator>
  );
}
