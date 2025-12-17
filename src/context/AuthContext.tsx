import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  // For development: skip auth temporarily
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AsyncStorage keys
const STORAGE_KEYS = {
  USER: "@spark:user",
  TOKEN: "@spark:token",
  ONBOARDING_COMPLETE: "@spark:onboarding_complete",
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);

      // Check if user has completed onboarding
      const onboardingComplete = await AsyncStorage.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETE
      );
      setHasCompletedOnboarding(onboardingComplete === "true");

      // Check for existing auth token/user
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (storedUser && storedToken) {
        // TODO: Validate token with backend API
        // For now, just restore user from storage
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const response = await api.login(email, password);
      // const { user, token } = response.data;

      // Mock login for now - will be replaced with API call
      const mockUser: User = {
        id: "1",
        email,
        name: "John Doe",
      };
      const mockToken = "mock-token-123";

      // Store user and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);

      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const response = await api.signup(email, password, name);
      // const { user, token } = response.data;

      // Mock signup for now - will be replaced with API call
      const mockUser: User = {
        id: "1",
        email,
        name,
      };
      const mockToken = "mock-token-123";

      // Store user and token
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);

      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Clear stored data
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
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

  // Development helper: skip auth for UI development
  const skipAuth = () => {
    setUser({ id: "dev", email: "dev@spark.com", name: "Dev User" });
    setIsAuthenticated(true);
    setHasCompletedOnboarding(true);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    hasCompletedOnboarding,
    login,
    signup,
    logout,
    completeOnboarding,
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
