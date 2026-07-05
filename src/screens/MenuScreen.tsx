import React, { useState, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";
import { getEventFeatures } from "../config/eventFeatures";

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
    const postEvent = getEventFeatures().postEvent;
    if (postEvent && (route === "Offers" || route === "Talent")) {
      return;
    }
    navigation.goBack();

    setTimeout(() => {
      switch (route) {
        case "Tickets":
          navigation.navigate("ScanQR", { initialTab: "My Ticket" });
          break;
        case "Messages":
          navigation.navigate("Messages");
          break;
        case "Profile":
          navigation.navigate("Profile");
          break;
        case "Startups":
          navigation.navigate("Exhibitors");
          break;
        case "Sponsors":
          navigation.navigate("Partners");
          break;
        case "Founders":
          navigation.navigate("Attendees", { roleFilter: "founder" });
          break;
        case "Investors":
          navigation.navigate("Attendees", { roleFilter: "investor" });
          break;
        case "Offers":
          navigation.navigate("PartnersOffers");
          break;
        case "Talent":
          navigation.navigate("Talent");
          break;
        case "TagPickup":
          navigation.navigate("TagPickup");
          break;
        case "Contact":
          navigation.navigate("Contact");
          break;
        case "AppGuide":
          navigation.navigate("AppGuide");
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
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
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
      postEventMode={getEventFeatures().postEvent}
    />
  );
}
