import AsyncStorage from "@react-native-async-storage/async-storage";
import { EVENT_ID } from "../config/env";
import {
  eventService,
  type Company,
} from "../services/eventService";
import type { PaginationMeta } from "../services/api";

export const STARTUPS_DIRECTORY_PAGE_SIZE = 30;
const STARTUPS_DIRECTORY_STALE_MS = 5 * 60_000;
const STARTUPS_DIRECTORY_STORAGE_KEY = `@spark:startups-directory:${EVENT_ID}:v1`;

export type StartupsDirectorySnapshot = {
  companies: Company[];
  pagination: PaginationMeta;
  fetchedAt: number;
};

let snapshot: StartupsDirectorySnapshot | null = null;
let fetchPromise: Promise<StartupsDirectorySnapshot> | null = null;
let hydrationPromise: Promise<StartupsDirectorySnapshot | null> | null = null;

function isStoredSnapshot(value: unknown): value is StartupsDirectorySnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StartupsDirectorySnapshot>;
  return (
    Array.isArray(candidate.companies) &&
    typeof candidate.fetchedAt === "number" &&
    !!candidate.pagination &&
    typeof candidate.pagination.count === "number"
  );
}

export function getCachedStartupsDirectory(): StartupsDirectorySnapshot | null {
  return snapshot;
}

export function isStartupsDirectoryCacheFresh(): boolean {
  return Boolean(
    snapshot && Date.now() - snapshot.fetchedAt < STARTUPS_DIRECTORY_STALE_MS,
  );
}

/** Hydrate the first page from disk so cold starts can paint before the API. */
export async function hydrateStartupsDirectoryCache(): Promise<StartupsDirectorySnapshot | null> {
  if (snapshot) return snapshot;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STARTUPS_DIRECTORY_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredSnapshot(parsed)) return null;
      if (!snapshot) snapshot = parsed;
      return snapshot;
    } catch {
      return null;
    }
  })();

  try {
    return await hydrationPromise;
  } finally {
    hydrationPromise = null;
  }
}

export function invalidateStartupsDirectoryCache(): void {
  snapshot = null;
  fetchPromise = null;
  hydrationPromise = null;
  void AsyncStorage.removeItem(STARTUPS_DIRECTORY_STORAGE_KEY).catch(() => {});
}

async function loadStartupsDirectory(
  force: boolean,
): Promise<StartupsDirectorySnapshot> {
  if (!force && !snapshot) {
    await hydrateStartupsDirectoryCache();
  }

  if (!force && snapshot && isStartupsDirectoryCacheFresh()) {
    return snapshot;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    const response = await eventService.getDirectoryCompanies(
      EVENT_ID,
      "startup",
      {
        page: 1,
        page_size: STARTUPS_DIRECTORY_PAGE_SIZE,
        ordering: "-id",
      },
    );
    snapshot = {
      companies: response.companies,
      pagination: response.pagination,
      fetchedAt: Date.now(),
    };
    void AsyncStorage.setItem(
      STARTUPS_DIRECTORY_STORAGE_KEY,
      JSON.stringify(snapshot),
    ).catch(() => {});
    return snapshot;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

/**
 * Load the first startup-directory page once and share it between Home and the
 * full directory. Fresh cached data renders immediately; callers can force a
 * refresh without clearing the visible snapshot.
 */
export function ensureStartupsDirectory(options?: {
  force?: boolean;
}): Promise<StartupsDirectorySnapshot> {
  return loadStartupsDirectory(options?.force ?? false);
}
