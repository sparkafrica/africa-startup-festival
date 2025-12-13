import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import Menu from "../components/Menu";

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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

  return (
    <Menu onClose={() => navigation.goBack()} onNavigate={handleNavigate} />
  );
}
