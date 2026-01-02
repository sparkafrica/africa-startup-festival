import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  // Add more user properties as needed
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedProfile: boolean;
  hasSeenWelcome: boolean;
  // Email-based login flow
  requestVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeProfile: () => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  // For development: skip auth temporarily
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AsyncStorage keys
const STORAGE_KEYS = {
  USER: "@spark:user",
  TOKEN: "@spark:token",
  ONBOARDING_COMPLETE: "@spark:onboarding_complete",
  PROFILE_COMPLETE: "@spark:profile_complete",
  WELCOME_SEEN: "@spark:welcome_seen",
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Development: Set to true to force login every time (clears stored auth)
  // Set to false to allow persistent sessions
  const FORCE_LOGIN_ON_START = false; // Change to true to force login every app start

  const checkAuthState = useCallback(async () => {
    try {
      setIsLoading(true);

      // Development: Clear stored auth if FORCE_LOGIN_ON_START is true
      if (FORCE_LOGIN_ON_START) {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER,
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.PROFILE_COMPLETE,
          STORAGE_KEYS.ONBOARDING_COMPLETE,
          STORAGE_KEYS.WELCOME_SEEN,
        ]);
        setUser(null);
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setHasCompletedProfile(false);
        setHasSeenWelcome(false);
        return;
      }

      // Check for existing auth token/user
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      // Only restore auth state if both user and token exist
      // TODO: In production, validate token with backend API before restoring
      if (storedUser && storedToken) {
        try {
          // TODO: Validate token with backend API
          // const isValid = await validateToken(storedToken);
          // if (!isValid) {
          //   // Token expired or invalid, clear storage and require re-login
          //   await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
          //   return;
          // }

          // Restore user from storage
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Check if user has completed onboarding
          const onboardingComplete = await AsyncStorage.getItem(
            STORAGE_KEYS.ONBOARDING_COMPLETE
          );
          setHasCompletedOnboarding(onboardingComplete === "true");

          // Check if user has completed profile
          const profileComplete = await AsyncStorage.getItem(
            STORAGE_KEYS.PROFILE_COMPLETE
          );
          setHasCompletedProfile(profileComplete === "true");

          // Check if user has seen Welcome screen
          const welcomeSeen = await AsyncStorage.getItem(
            STORAGE_KEYS.WELCOME_SEEN
          );
          setHasSeenWelcome(welcomeSeen === "true");

          // Only set authenticated if profile is completed
          // This ensures users must complete the full flow
          if (profileComplete === "true") {
            setIsAuthenticated(true);
          } else {
            // User exists but profile not completed - keep authenticated false
            // They'll need to complete profile to access main app
            setIsAuthenticated(false);
          }
        } catch (parseError) {
          console.error("Error parsing stored user:", parseError);
          // Clear corrupted data
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.USER,
            STORAGE_KEYS.TOKEN,
          ]);
        }
      } else {
        // No stored auth - user must login
        // Reset all state to ensure clean login flow
        setUser(null);
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setHasCompletedProfile(false);
        setHasSeenWelcome(false);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // On error, require login
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      setHasCompletedProfile(false);
      setHasSeenWelcome(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Request verification code to be sent to email
  // TODO: BACKEND INTEGRATION - Replace mock with actual API call
  // API Endpoint: POST /api/auth/request-verification-code
  // Request Body: { email: string }
  // Response: { success: boolean, message?: string }
  // Error Handling: Handle network errors, invalid email, rate limiting
  // Real-time: Consider WebSocket for immediate code delivery status
  const requestVerificationCode = async (email: string) => {
    try {
      setIsLoading(true);

      // TODO: BACKEND - Replace with actual API call
      // await api.post('/auth/request-code', { email });
      // TODO: BACKEND - Handle API response and errors
      // TODO: BACKEND - Implement rate limiting on frontend (prevent spam)
      // TODO: BACKEND - Add retry logic with exponential backoff
      // TODO: BACKEND - Store request timestamp to prevent duplicate requests

      // Mock: In real app, this would send verification code to email
      console.log(`Verification code requested for: ${email}`);

      // For development, we'll just proceed (no actual email sent)
    } catch (error) {
      console.error("Request verification code error:", error);
      // TODO: BACKEND - Handle specific error types (network, server, validation)
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the code sent to email
  // TODO: BACKEND INTEGRATION - Replace mock verification with actual API call
  // API Endpoint: POST /api/auth/verify-code
  // Request Body: { email: string, code: string }
  // Response: { user: User, token: string, refreshToken?: string }
  // Error Handling: Handle invalid code, expired code, too many attempts
  // Real-time: Consider WebSocket for real-time verification status
  const verifyCode = async (email: string, code: string) => {
    try {
      // Don't set isLoading here - it causes AppNavigator to show loading spinner
      // which interrupts navigation. The screen can handle its own loading state.

      // TODO: BACKEND - Replace with actual API call
      // const response = await api.post('/auth/verify-code', { email, code });
      // const { user, token, refreshToken } = response.data;
      // TODO: BACKEND - Validate response structure
      // TODO: BACKEND - Store refreshToken if provided for token renewal
      // TODO: BACKEND - Handle token expiration and refresh logic
      // TODO: BACKEND - Implement code attempt tracking (prevent brute force)

      // Mock verification for now - will be replaced with API call
      // In real app, this would validate the code with backend
      if (code.length < 4) {
        throw new Error("Invalid verification code");
      }

      const mockUser: User = {
        id: "1",
        email,
        name: "", // Name will be set during profile completion
      };
      const mockToken = "mock-token-123";

      // TODO: BACKEND - Store actual user data and tokens from API response
      // Store user and token (but not authenticated yet - need to complete profile)
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
      // TODO: BACKEND - Store refreshToken if provided
      // TODO: BACKEND - Encrypt sensitive token data before storage

      setUser(mockUser);
      // User is verified but not fully authenticated until profile is completed
      // Profile completion will set isAuthenticated to true
    } catch (error) {
      console.error("Verify code error:", error);
      // TODO: BACKEND - Handle specific error types (invalid code, expired, rate limit)
      throw error;
    }
  };

  // Logout user and clear all session data
  // TODO: BACKEND INTEGRATION - Call logout API endpoint to invalidate server-side session
  // API Endpoint: POST /api/auth/logout
  // Request Headers: { Authorization: `Bearer ${token}` }
  // Response: { success: boolean }
  // Real-time: Consider WebSocket disconnect on logout
  const logout = async () => {
    try {
      setIsLoading(true);

      // TODO: BACKEND - Call logout API to invalidate token on server
      // await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      // TODO: BACKEND - Handle logout errors gracefully (network issues shouldn't block local logout)

      // Clear all stored data for a complete logout
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.WELCOME_SEEN,
        STORAGE_KEYS.PROFILE_COMPLETE,
        STORAGE_KEYS.ONBOARDING_COMPLETE,
      ]);
      // TODO: BACKEND - Also clear refreshToken if stored separately

      // Reset all state
      setUser(null);
      setIsAuthenticated(false);
      setHasCompletedProfile(false);
      setHasCompletedOnboarding(false);
      setHasSeenWelcome(false);
      // TODO: BACKEND - Clear any cached API responses
      // TODO: BACKEND - Cancel any pending API requests
    } catch (error) {
      console.error("Logout error:", error);
      // TODO: BACKEND - Even if API call fails, still clear local data
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, "true");
      setHasSeenWelcome(true);
    } catch (error) {
      console.error("Error marking welcome as seen:", error);
    }
  };

  // Mark profile as completed
  // TODO: BACKEND INTEGRATION - This should be called after profile data is successfully saved to backend
  // This function should be called from ProfileScreen after successful API submission
  // TODO: BACKEND - Profile completion should be determined by backend response, not just local storage
  // TODO: BACKEND - Consider moving this logic to ProfileScreen after successful API call
  const completeProfile = async () => {
    try {
      // TODO: BACKEND - Remove this local storage update, let backend determine completion status
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_COMPLETE, "true");
      setHasCompletedProfile(true);
      // Once profile is completed, user is fully authenticated
      setIsAuthenticated(true);
      // TODO: BACKEND - Backend should return updated user object with profile completion status
    } catch (error) {
      console.error("Error completing profile:", error);
    }
  };

  // Development helper: skip auth for UI development
  // NOTE: This bypasses the login flow - use only for development/testing
  const skipAuth = () => {
    const devUser = { id: "dev", email: "dev@spark.com", name: "Dev User" };
    setUser(devUser);
    setIsAuthenticated(true);
    setHasCompletedOnboarding(true);
    setHasCompletedProfile(true);
    setHasSeenWelcome(true);
    // Also store in AsyncStorage so it persists
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(devUser));
    AsyncStorage.setItem(STORAGE_KEYS.TOKEN, "dev-token");
    AsyncStorage.setItem(STORAGE_KEYS.PROFILE_COMPLETE, "true");
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
    AsyncStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, "true");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    hasCompletedOnboarding,
    hasCompletedProfile,
    hasSeenWelcome,
    requestVerificationCode,
    verifyCode,
    logout,
    completeOnboarding,
    completeProfile,
    markWelcomeSeen,
    skipAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
