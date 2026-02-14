import React, { useState, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger((n) => n + 1);
    }, [])
  );

  const handleNavigate = (route: string) => {
    // Close menu first, then navigate
    navigation.goBack();

    // Use setTimeout to ensure menu closes before navigation
    setTimeout(() => {
      switch (route) {
        case "Tickets":
          navigation.navigate("ScanQR", { initialTab: "My Ticket" });
          break;
        case "Profile":
          navigation.navigate("Profile");
          break;
        case "Map":
          Linking.openURL("https://africatechnologyexpo.com/floor-plan").catch(() => {
            Alert.alert("Cannot Open Link", "The venue map could not be opened.");
          });
          break;
        case "Offers":
          navigation.navigate("PartnersOffers");
          break;
        case "Talent":
          navigation.navigate("Talent");
          break;
        case "Contact":
          navigation.navigate("Contact");
          break;
        case "AppGuide":
          // TODO: Add AppGuide route when implemented
          console.log("Navigate to AppGuide");
          break;
        case "AppSuggestions":
          Linking.openURL("https://forms.gle/cc3W9UvfeXV1Zufu7").catch(() => {
            Alert.alert("Cannot Open Link", "The link could not be opened.");
          });
          break;
        default:
          console.log(`Navigate to ${route}`);
      }
    }, 100);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Navigation will automatically switch to AuthNavigator
              // since isAuthenticated is now false
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Menu
      onClose={() => navigation.goBack()}
      refreshTrigger={refreshTrigger}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
