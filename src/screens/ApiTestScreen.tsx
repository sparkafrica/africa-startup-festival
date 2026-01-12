/**
 * API Test Screen
 *
 * Temporary screen for testing backend API integration.
 * Use this to verify endpoints work before full integration.
 *
 * TODO: Remove this screen before production release
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService, api } from "../services";
import { handleApiError } from "../services/api.helpers";

export default function ApiTestScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Test 1: Request OTP
  const testRequestOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    setLoading(true);
    addLog(`📤 Requesting OTP for: ${email}`);

    try {
      const result = await authService.requestOTP(email);
      addLog(`✅ OTP Request Success: ${result.message}`);
      Alert.alert("Success", result.message || "OTP sent successfully!");
    } catch (error) {
      addLog(
        `❌ OTP Request Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      handleApiError(error);
      console.error("Request OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Verify OTP
  const testVerifyOTP = async () => {
    if (!email.trim() || !otp.trim()) {
      Alert.alert("Error", "Please enter both email and OTP code");
      return;
    }

    setLoading(true);
    addLog(`📤 Verifying OTP: ${email} / ${otp}`);

    try {
      // Service layer now handles token storage internally
      await authService.verifyOTP(email, otp);
      addLog(`✅ OTP Verification Success!`);
      addLog(`💾 Token stored automatically by service layer`);

      // Get token to display preview (service layer handles storage)
      const token = await api.getToken();
      if (token) {
        addLog(`🔑 Token preview: ${token.substring(0, 20)}...`);
        Alert.alert(
          "Success",
          `OTP verified! Token stored.\n\nToken preview: ${token.substring(
            0,
            30
          )}...`
        );
      } else {
        Alert.alert("Success", "OTP verified! Token stored.");
      }
    } catch (error) {
      addLog(
        `❌ OTP Verification Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      handleApiError(error);
      console.error("Verify OTP error:", error);

      // Log error details for debugging
      if (error instanceof Error) {
        addLog(`Error details: ${JSON.stringify(error, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Get Current User (requires authentication)
  const testGetCurrentUser = async () => {
    setLoading(true);
    addLog(`📤 Getting current user profile...`);

    try {
      const user = await authService.getCurrentUser();
      addLog(`✅ Get User Success!`);
      addLog(`👤 User ID: ${user.user_id}`);
      addLog(`📧 Email: ${user.email}`);
      addLog(`👤 Name: ${user.first_name || ""} ${user.last_name || ""}`);

      Alert.alert(
        "Success",
        `User Profile Retrieved!\n\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}`
      );
    } catch (error) {
      addLog(
        `❌ Get User Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      handleApiError(error);
      console.error("Get user error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Check Stored Token
  const testCheckToken = async () => {
    try {
      const token = await api.getToken();
      if (token) {
        addLog(`🔑 Stored Token: ${token.substring(0, 30)}...`);
        Alert.alert(
          "Token Found",
          `Token is stored:\n${token.substring(0, 50)}...`
        );
      } else {
        addLog(`⚠️ No token stored`);
        Alert.alert("No Token", "No authentication token is currently stored.");
      }
    } catch (error) {
      addLog(
        `❌ Check Token Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Test 5: Logout
  const testLogout = async () => {
    setLoading(true);
    addLog(`📤 Logging out...`);

    try {
      await authService.logout();
      await api.clearTokens();
      addLog(`✅ Logout Success!`);
      addLog(`🗑️ Tokens cleared`);
      Alert.alert("Success", "Logged out successfully!");
    } catch (error) {
      addLog(
        `❌ Logout Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Even if logout fails, clear tokens locally
      await api.clearTokens();
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-neutral-900 mb-4">
          API Test Screen
        </Text>
        <Text className="text-sm text-neutral-600 mb-6">
          Test backend API endpoints. Check logs below for detailed responses.
        </Text>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">
            Email Address
          </Text>
          <TextInput
            className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base"
            placeholder="user@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* OTP Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-2">
            OTP Code (use "000000" for test accounts)
          </Text>
          <TextInput
            className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-base"
            placeholder="000000"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
        </View>

        {/* Test Buttons */}
        <View className="gap-3 mb-6">
          <Pressable
            onPress={testRequestOTP}
            disabled={loading}
            className="bg-black rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">1. Request OTP</Text>
            )}
          </Pressable>

          <Pressable
            onPress={testVerifyOTP}
            disabled={loading}
            className="bg-black rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">2. Verify OTP</Text>
            )}
          </Pressable>

          <Pressable
            onPress={testGetCurrentUser}
            disabled={loading}
            className="bg-blue-600 rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">
                3. Get Current User (Auth Required)
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={testCheckToken}
            disabled={loading}
            className="bg-green-600 rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold">
              4. Check Stored Token
            </Text>
          </Pressable>

          <Pressable
            onPress={testLogout}
            disabled={loading}
            className="bg-red-600 rounded-xl py-4 items-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">5. Logout</Text>
            )}
          </Pressable>

          <Pressable
            onPress={clearLogs}
            className="bg-neutral-300 rounded-xl py-3 items-center"
          >
            <Text className="text-neutral-900 font-semibold">Clear Logs</Text>
          </Pressable>
        </View>

        {/* Logs Section */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-neutral-900 mb-2">
            Test Logs
          </Text>
          <View className="bg-neutral-100 rounded-xl p-4 min-h-[200px]">
            {logs.length === 0 ? (
              <Text className="text-neutral-500 italic">
                No logs yet. Test an endpoint to see results.
              </Text>
            ) : (
              <ScrollView>
                {logs.map((log, index) => (
                  <Text
                    key={index}
                    className="text-xs font-mono text-neutral-700 mb-1"
                  >
                    {log}
                  </Text>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-neutral-900 mb-2">
            Testing Instructions:
          </Text>
          <Text className="text-xs text-neutral-700 mb-1">
            1. Enter your email address
          </Text>
          <Text className="text-xs text-neutral-700 mb-1">
            2. Click "Request OTP" - check email for code
          </Text>
          <Text className="text-xs text-neutral-700 mb-1">
            3. Enter OTP code (use "000000" for test accounts)
          </Text>
          <Text className="text-xs text-neutral-700 mb-1">
            4. Click "Verify OTP" - token will be stored
          </Text>
          <Text className="text-xs text-neutral-700">
            5. Click "Get Current User" to test authenticated endpoint
          </Text>
        </View>

        {/* Environment Info */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Text className="text-sm font-semibold text-neutral-900 mb-2">
            Debug Info:
          </Text>
          <Text className="text-xs text-neutral-700 font-mono">
            Base URL: Check env.ts
          </Text>
          <Text className="text-xs text-neutral-700 font-mono mt-1">
            Check console for detailed request/response logs
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
