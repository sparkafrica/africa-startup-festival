import "react-native-gesture-handler";
import "./global.d.ts";
import React from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { useFonts } from "expo-font";
import { Text, View, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { ChecklistProvider } from "./src/context/ChecklistContext";
import { MeetingsBadgeProvider } from "./src/context/MeetingsBadgeContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import AppNavigator from "./src/navigation/AppNavigator";
import PushTapHandler from "./src/components/PushTapHandler";
import { LoadingSpinner } from "./src/components";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // Inter Display - ONLY font family used throughout the app
    "InterDisplay-Light": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Light.ttf"),
    "InterDisplay-Regular": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Regular.ttf"),
    "InterDisplay-Medium": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Medium.ttf"),
    "InterDisplay-SemiBold": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-SemiBold.ttf"),
    "InterDisplay-Bold": require("./src/assets/fonts/Inter Display/Inter Display/InterDisplay-Bold.ttf"),
  });

  const [imagesPreloaded, setImagesPreloaded] = React.useState(false);

  // Preload banner images during app initialization
  // Render images off-screen to force React Native to load and decode them
  React.useEffect(() => {
    // Small delay to ensure images are rendered and cached
    const timer = setTimeout(() => {
      setImagesPreloaded(true);
      console.log("✅ Banner images preloaded");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Log font loading status
  React.useEffect(() => {
    if (fontError) {
      console.error("❌ Font loading error:", fontError);
    }
    if (fontsLoaded) {
      console.log("✅ Fonts loaded - Inter Display variants available");
      console.log("📝 Default font set to: InterDisplay-Regular");
    }
  }, [fontsLoaded, fontError]);

  // Wait for both fonts and images to be ready
  if (!fontsLoaded || !imagesPreloaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Preload banner images off-screen */}
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <Image
            source={require("./src/assets/images/lhs-card.jpg")}
            style={{ width: 1, height: 1 }}
            resizeMode="cover"
          />
          <Image
            source={require("./src/assets/images/rhs-card.jpg")}
            style={{ width: 1, height: 1 }}
            resizeMode="cover"
          />
        </View>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // Set default font family for all Text components globally
  // Using Inter Display Regular as the default font
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: "InterDisplay-Regular" };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 font-sans">
        <AuthProvider>
          <ChecklistProvider>
            <MeetingsBadgeProvider>
              <NotificationsProvider>
                <PushTapHandler />
                <NavigationContainer ref={navigationRef}>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </NotificationsProvider>
            </MeetingsBadgeProvider>
          </ChecklistProvider>
        </AuthProvider>
      </View>
    </GestureHandlerRootView>
  );
}
