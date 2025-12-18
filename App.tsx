import "react-native-gesture-handler";
import "./global.d.ts";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter";
// import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { Text, View, ActivityIndicator } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    // Roboto_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Set default font family for all Text components
  // Change this to "Inter_400Regular" or "Roboto_400Regular" to switch fonts
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: "Inter_400Regular" };
  // (Text as any).defaultProps.style = { fontFamily: "Roboto_400Regular" };

  return (
    <AuthProvider>
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
    </AuthProvider>
  );
}
