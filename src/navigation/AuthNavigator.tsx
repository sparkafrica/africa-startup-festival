import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuth } from "../context/AuthContext";

// Auth Screens
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AuthNavigator - Handles authentication flow
 *
 * Flow:
 * - If user hasn't completed onboarding → Show Onboarding first
 * - If onboarding completed → Show Login as initial screen
 * - User can navigate between Login and Signup
 */
export default function AuthNavigator() {
  const { hasCompletedOnboarding } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={hasCompletedOnboarding ? "Login" : "Onboarding"}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
