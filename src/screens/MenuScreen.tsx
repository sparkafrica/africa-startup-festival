import React from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

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
          // TODO: Add Map route when implemented
          console.log("Navigate to Map");
          break;
        case "Offers":
          // TODO: Add Offers route when implemented
          console.log("Navigate to Offers");
          break;
        case "Talent":
          // TODO: Add Talent route when implemented
          console.log("Navigate to Talent");
          break;
        case "Contact":
          navigation.navigate("Contact");
          break;
        case "AppGuide":
          // TODO: Add AppGuide route when implemented
          console.log("Navigate to AppGuide");
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
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
