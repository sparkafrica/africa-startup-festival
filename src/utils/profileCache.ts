/**
 * Persistent profile cache for offline support.
 * Used by ProfileScreen and CompleteProfileScreen when GET /auth/user/ fails.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "../services/authService";

const PROFILE_CACHE_KEY = "@spark:profile_cache";

export async function getProfileCache(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function setProfileCache(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to cache profile:", e);
  }
}

export async function clearProfileCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* no-op */
  }
}
