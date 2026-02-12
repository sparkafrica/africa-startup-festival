import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, UserProfile, Company } from "../services/authService";
import { api } from "../services/api";
import { isProfileComplete } from "../utils/profileCompletion";
import { ticketService, clearTicketCache } from "../services/ticketService";
import { notificationService } from "../services/notificationService";
import { registerForPushNotifications } from "../utils/pushRegistration";
import { EVENT_ID } from "../config/env";

// Types
/**
 * User interface matching backend UserProfile structure
 * This ensures type accuracy and prevents data loss when mapping from API responses
 */
export interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
  bio?: string | null;
  address?: string;
  country?: string;
  phone_number?: string;
  job_title?: string;
  metadata?: any; // User metadata (interests, linkedIn, industry, etc.)
  company?: Company | null; // Company field from backend (nullable)
  // Add other fields as needed based on backend CustomUserDetails schema
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
// Note: TOKEN storage is handled by API client service layer (D2: Option C)
const STORAGE_KEYS = {
  USER: "@spark:user",
  ONBOARDING_COMPLETE: "@spark:onboarding_complete",
  PROFILE_COMPLETE: "@spark:profile_complete",
  WELCOME_SEEN: "@spark:welcome_seen",
  PUSH_REGISTRATION_ID: "@spark:push_registration_id",
} as const;

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

  // When API client fails to refresh token (e.g. no refresh token), clear session so user is sent to login
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PROFILE_COMPLETE,
        STORAGE_KEYS.ONBOARDING_COMPLETE,
        STORAGE_KEYS.WELCOME_SEEN,
      ]).catch(() => {});
    };
    api.setOnSessionExpired(handleSessionExpired);
    return () => api.setOnSessionExpired(null);
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      setIsLoading(true);

      // Development: Clear stored auth if FORCE_LOGIN_ON_START is true
      if (FORCE_LOGIN_ON_START) {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER,
          STORAGE_KEYS.PROFILE_COMPLETE,
          STORAGE_KEYS.ONBOARDING_COMPLETE,
          STORAGE_KEYS.WELCOME_SEEN,
        ]);
        // Clear tokens from API client (service layer handles token storage)
        await api.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setHasCompletedProfile(false);
        setHasSeenWelcome(false);
        return;
      }

      // Check for existing auth token/user
      // Service layer pattern (D2, D6): Get token from API client, not AsyncStorage directly
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedToken = await api.getToken();

      // Only restore auth state if both user and token exist
      if (storedUser && storedToken) {
        try {
          // Fetch fresh user profile from backend to determine completion status
          // Backend is the source of truth for profile completion
          let userProfile: UserProfile;
          try {
            userProfile = await authService.getCurrentUser();
            // Update stored user with latest data from backend
            await AsyncStorage.setItem(
              STORAGE_KEYS.USER,
              JSON.stringify(userProfile)
            );
          } catch (fetchError) {
            // If fetching fails (token expired, network error, etc.), use stored user as fallback
            console.warn(
              "Failed to fetch user profile from backend, using stored data:",
              fetchError
            );
            userProfile = JSON.parse(storedUser) as UserProfile;
          }

          // Map UserProfile to User (they have the same structure)
          const user: User = userProfile;
          setUser(user);

          // Check if user has completed onboarding
          const onboardingComplete = await AsyncStorage.getItem(
            STORAGE_KEYS.ONBOARDING_COMPLETE
          );
          setHasCompletedOnboarding(onboardingComplete === "true");

          // Fetch ticket quotas to determine if company profile is required
          let ticketQuotas: any[] = [];
          try {
            ticketQuotas = await ticketService.getUserQuotas(EVENT_ID);
          } catch (error) {
            console.warn(
              "Failed to fetch ticket quotas for profile completion check:",
              error
            );
            // Continue without ticket quotas - will fall back to checking if company exists
          }

          // Prefetch user ticket for Menu (reduces green→blue flash when opening Menu)
          ticketService.getUserTicket(EVENT_ID).catch(() => {});

          // Determine profile completion from backend data (field-based inference)
          // Pass ticket quotas to check if company profile is required for exhibitor/partner users
          const profileComplete = isProfileComplete(userProfile, ticketQuotas);
          setHasCompletedProfile(profileComplete);

          // Check if user has seen Welcome screen
          const welcomeSeen = await AsyncStorage.getItem(
            STORAGE_KEYS.WELCOME_SEEN
          );
          setHasSeenWelcome(welcomeSeen === "true");

          // Only set authenticated if profile is completed
          // This ensures users must complete the full flow
          if (profileComplete) {
            setIsAuthenticated(true);
          } else {
            // User exists but profile not completed - keep authenticated false
            // They'll need to complete profile to access main app
            setIsAuthenticated(false);
          }
        } catch (parseError) {
          console.error("Error parsing stored user:", parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
          await api.clearTokens();
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

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    registerForPushNotifications()
      .then((registrationId) => {
        if (!cancelled && registrationId) {
          AsyncStorage.setItem(STORAGE_KEYS.PUSH_REGISTRATION_ID, registrationId);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  /**
   * Request verification code to be sent to email
   *
   * Service layer pattern (D3): authService handles API call and error handling.
   * AuthContext just passes through to service layer and lets errors bubble up to UI.
   * No isLoading state change here - screen handles its own loading state (D4).
   *
   * Backend Endpoint: POST /auth/email/
   */
  const requestVerificationCode = async (email: string) => {
    // Service layer handles API call, error handling, and retry logic
    // Errors from service layer bubble up to screen for display
    await authService.requestOTP(email);
  };

  /**
   * Verify OTP code and authenticate user
   *
   * Service layer pattern (D2, D3):
   * - authService.verifyOTP handles API call and token storage (D2: Option C)
   * - authService.getCurrentUser fetches user profile after token is stored
   * - AuthContext maps UserProfile to User (they have same structure now) and updates state
   * - Errors bubble up from service layer to screen (D3: Option A)
   * - No isLoading state change - screen handles its own loading (D4)
   *
   * Backend Flow:
   * 1. POST /auth/token/ - Verify OTP, returns token (stored by service layer)
   * 2. GET /auth/user/ - Get user profile using stored token
   */
  const verifyCode = async (email: string, code: string) => {
    // Step 1: Verify OTP and store token (service layer handles storage)
    await authService.verifyOTP(email, code);

    // Step 2: Fetch user profile (token is now stored, so API client adds it to headers)
    const userProfile = await authService.getCurrentUser();

    // Step 3: Fetch ticket quotas to determine if company profile is required
    let ticketQuotas: any[] = [];
    try {
      ticketQuotas = await ticketService.getUserQuotas(EVENT_ID);
    } catch (error) {
      console.warn(
        "Failed to fetch ticket quotas for profile completion check:",
        error
      );
      // Continue without ticket quotas - will fall back to checking if company exists
    }

    // Prefetch user ticket for Menu (reduces green→blue flash when opening Menu)
    ticketService.getUserTicket(EVENT_ID).catch(() => {});

    // Step 4: Map UserProfile to User (they have the same structure now, so direct assignment)
    // User interface matches backend UserProfile structure (D1: Option B)
    const user: User = userProfile;

    // Step 5: Store user in AsyncStorage for persistence
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    // Step 6: Determine profile completion from backend data (field-based inference)
    // Pass ticket quotas to check if company profile is required for exhibitor/partner users
    const profileComplete = isProfileComplete(userProfile, ticketQuotas);

    // Step 7: Update state
    setUser(user);
    setHasCompletedProfile(profileComplete);

    // Step 8: Set authenticated status based on profile completion
    // User is fully authenticated only if profile is completed
    if (profileComplete) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  /**
   * Logout user and clear all session data
   *
   * Service layer pattern (D2, D3):
   * - authService.logout calls backend API and clears tokens (D2: service handles API + tokens)
   * - AuthContext clears local user data and state
   * - Errors from service layer bubble up (D3: Option A)
   * - No isLoading state change - screen/menu handles its own loading (D4)
   *
   * Backend Endpoint: POST /auth/logout/
   */
  const logout = async () => {
    // Unregister push device before clearing tokens (API needs auth)
    try {
      const registrationId = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_REGISTRATION_ID);
      if (registrationId) {
        await notificationService.unregisterDevice(registrationId);
      }
    } catch (error) {
      // Don't block logout if unregister fails
    }

    try {
      // Service layer handles API call and token clearing
      await authService.logout();
    } catch (error) {
      // Even if API call fails, still clear local data (network issues shouldn't block logout)
      console.error("Logout API error (clearing local data anyway):", error);
    }

    // Clear ticket cache so next user doesn't see previous user's ticket
    clearTicketCache();

    // Clear all local stored data (service layer already cleared tokens)
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.WELCOME_SEEN,
      STORAGE_KEYS.PROFILE_COMPLETE,
      STORAGE_KEYS.ONBOARDING_COMPLETE,
      STORAGE_KEYS.PUSH_REGISTRATION_ID,
    ]);

    // Reset all state
    setUser(null);
    setIsAuthenticated(false);
    setHasCompletedProfile(false);
    setHasCompletedOnboarding(false);
    setHasSeenWelcome(false);
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

  /**
   * Mark profile as completed
   *
   * This should be called after profile data is successfully saved to backend.
   * Fetches fresh user profile from backend and determines completion status
   * based on field-based inference (backend doesn't track completion explicitly).
   *
   * Called from ProfileCreatedScreen after successful profile save.
   */
  const completeProfile = async () => {
    try {
      // Fetch fresh user profile from backend (source of truth)
      const userProfile = await authService.getCurrentUser();

      // Fetch ticket quotas to determine if company profile is required
      let ticketQuotas: any[] = [];
      try {
        ticketQuotas = await ticketService.getUserQuotas(EVENT_ID);
      } catch (error) {
        console.warn(
          "Failed to fetch ticket quotas for profile completion check:",
          error
        );
        // Continue without ticket quotas - will fall back to checking if company exists
      }

      // Prefetch user ticket for Menu
      ticketService.getUserTicket(EVENT_ID).catch(() => {});

      // Update stored user with latest data
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(userProfile)
      );

      // Map UserProfile to User and update state
      const user: User = userProfile;
      setUser(user);

      // Determine profile completion from backend data (field-based inference)
      // Pass ticket quotas to check if company profile is required for exhibitor/partner users
      const profileComplete = isProfileComplete(userProfile, ticketQuotas);
      // Debug logging removed for production - uncomment if needed for debugging
      // console.log("Profile completion status from backend:", profileComplete);
      setHasCompletedProfile(profileComplete);

      // Once profile is completed, user is fully authenticated
      if (profileComplete) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error completing profile:", error);
      // On error, don't update state - user will need to retry
      throw error;
    }
  };

  // Development helper: skip auth for UI development
  // NOTE: This bypasses the login flow - use only for development/testing
  const skipAuth = async () => {
    const devUser: User = {
      user_id: "dev",
      email: "dev@spark.com",
      first_name: "Dev",
      last_name: "User",
    };
    setUser(devUser);
    setIsAuthenticated(true);
    setHasCompletedOnboarding(true);
    setHasCompletedProfile(true);
    setHasSeenWelcome(true);
    // Store in AsyncStorage so it persists
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(devUser));
    // Store token in API client (service layer handles token storage)
    await api.setTokens({
      accessToken: "dev-token",
      expiresIn: 3600,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_COMPLETE, "true");
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
    await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, "true");
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
