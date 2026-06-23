import "react-native-gesture-handler";
import "./global.d.ts";
import { initSentry } from "./src/utils/sentry";
import * as Sentry from "@sentry/react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { Text, View, Pressable, Image } from "react-native";
import * as Updates from "expo-updates";
import { useFonts } from "expo-font";

initSentry();

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ChecklistProvider } from "./src/context/ChecklistContext";
import { MeetingsBadgeProvider } from "./src/context/MeetingsBadgeContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import { MessagesBadgeProvider } from "./src/context/MessagesBadgeContext";
import { ChatProvider } from "./src/context/ChatContext";
import { HomeScrollProvider } from "./src/context/HomeScrollContext";
import { FloatingNavVisibilityProvider } from "./src/context/FloatingNavVisibilityContext";
import AppNavigationContainer from "./src/navigation/AppNavigationContainer";
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
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Log font loading status
  React.useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontsLoaded, fontError]);

  // Wait for both fonts and images to be ready
  if (!fontsLoaded || !imagesPreloaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Preload banner images off-screen */}
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}>
          <Image
            source={require("./src/assets/images/1st-card.jpeg")}
            style={{ width: 1, height: 1 }}
            resizeMode="cover"
          />
          <Image
            source={require("./src/assets/images/2nd-card.jpg")}
            style={{ width: 1, height: 1 }}
            resizeMode="cover"
          />
          {/* <Image
            source={require("./src/assets/images/3rd-card.jpg")}
            style={{ width: 1, height: 1 }}
            resizeMode="cover"
          /> */}
        </View>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // Set default font family for all Text components globally
  // Using Inter Display Regular as the default font
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: "InterDisplay-Regular" };

  function ErrorFallback() {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#FFF" }}>
        <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 16, color: "#171717" }}>
          Something went wrong. Please restart the app.
        </Text>
        {!__DEV__ && typeof Updates?.reloadAsync === "function" && (
          <Pressable
            onPress={() => Updates.reloadAsync()}
            style={{ backgroundColor: "#000", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600" }}>Reload</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <View className="flex-1 font-sans">
        <AuthProvider>
          <ChecklistProvider>
            <MeetingsBadgeProvider>
              <NotificationsProvider>
                <MessagesBadgeProvider>
                  <ChatProvider>
                    <HomeScrollProvider>
                      <FloatingNavVisibilityProvider>
                        <AppNavigationContainer />
                      </FloatingNavVisibilityProvider>
                    </HomeScrollProvider>
                  </ChatProvider>
                </MessagesBadgeProvider>
              </NotificationsProvider>
            </MeetingsBadgeProvider>
          </ChecklistProvider>
        </AuthProvider>
      </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
}
