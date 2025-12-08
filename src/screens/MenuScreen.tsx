import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import Menu from "../components/Menu";

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigate = (route: string) => {
    // Handle navigation to different routes
    console.log(`Navigate to ${route}`);
    // You can add specific navigation logic here
  };

  return (
    <Menu
      onClose={() => navigation.goBack()}
      onNavigate={handleNavigate}
    />
  );
}

