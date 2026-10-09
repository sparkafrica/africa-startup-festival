import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const STORAGE_PREFIX = "@spark:profile_photo_draft:";
const DRAFT_DIRECTORY = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ""}profile-photo-drafts/`;

function draftKey(userId?: string): string | null {
  const normalized = userId?.trim();
  return normalized ? `${STORAGE_PREFIX}${normalized}` : null;
}

function extensionFromUri(uri: string): string {
  const clean = uri.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "png";
  if (clean.endsWith(".heic")) return "heic";
  if (clean.endsWith(".webp")) return "webp";
  return "jpg";
}

/**
 * Holds an unsaved profile photo in app-owned storage until the profile save
 * succeeds. This survives screen remounts, app backgrounding, and process restarts.
 */
export function useProfilePhotoDraft(userId?: string) {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    const key = draftKey(userId);
    if (!key) return;
    let cancelled = false;

    void (async () => {
      try {
        const storedUri = await AsyncStorage.getItem(key);
        if (!storedUri) return;
        const info = await FileSystem.getInfoAsync(storedUri);
        if (info.exists && !cancelled) {
          setSelectedImageUri(storedUri);
        } else if (!info.exists) {
          await AsyncStorage.removeItem(key);
        }
      } catch {
        // A missing/corrupt draft must never block Manage Profile.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const holdImage = useCallback(
    async (pickerUri: string): Promise<string> => {
      const key = draftKey(userId);
      setSelectedImageUri(pickerUri);
      if (!key || !DRAFT_DIRECTORY) return pickerUri;

      try {
        await FileSystem.makeDirectoryAsync(DRAFT_DIRECTORY, {
          intermediates: true,
        });
        const target = `${DRAFT_DIRECTORY}${encodeURIComponent(userId!)}.${extensionFromUri(pickerUri)}`;
        const existing = await FileSystem.getInfoAsync(target);
        if (existing.exists && target !== pickerUri) {
          await FileSystem.deleteAsync(target, { idempotent: true });
        }
        if (target !== pickerUri) {
          await FileSystem.copyAsync({ from: pickerUri, to: target });
        }
        await AsyncStorage.setItem(key, target);
        setSelectedImageUri(target);
        return target;
      } catch {
        // Keep the picker URI for this mounted session if persistence fails.
        return pickerUri;
      }
    },
    [userId],
  );

  const clearDraft = useCallback(async () => {
    const key = draftKey(userId);
    const uri = selectedImageUri;
    setSelectedImageUri(null);
    try {
      if (key) await AsyncStorage.removeItem(key);
      if (uri?.startsWith(DRAFT_DIRECTORY)) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // Cleanup is best-effort; UI state is already cleared.
    }
  }, [selectedImageUri, userId]);

  return { selectedImageUri, holdImage, clearDraft };
}
