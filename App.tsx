import "react-native-gesture-handler";
import "./global.d.ts";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Text, View, ActivityIndicator } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { ChecklistProvider } from "./src/context/ChecklistContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // Inter Display - ONLY font family used throughout the app
    "InterDisplay-Light": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Light.ttf"),
    "InterDisplay-Regular": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Regular.ttf"),
    "InterDisplay-Medium": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Medium.ttf"),
    "InterDisplay-SemiBold": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-SemiBold.ttf"),
    "InterDisplay-Bold": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Bold.ttf"),
  });

  // Debug: Log font loading status
  React.useEffect(() => {
    if (fontError) {
      console.error("❌ Font loading error:", fontError);
    }
    if (fontsLoaded) {
      console.log("✅ Inter Display fonts loaded successfully");
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Set default font family for all Text components globally
  // Using Inter Display Regular as the default font
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: "InterDisplay-Regular" };

  return (
    <View className="flex-1 font-sans">
      <AuthProvider>
        <ChecklistProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
        </ChecklistProvider>
      </AuthProvider>
    </View>
  );
}
