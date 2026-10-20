import { EVENT_ID } from "../config/env";
import {
  eventService,
  type Company,
} from "../services/eventService";
import type { PaginationMeta } from "../services/api";

export const STARTUPS_DIRECTORY_PAGE_SIZE = 30;
const STARTUPS_DIRECTORY_STALE_MS = 60_000;

export type StartupsDirectorySnapshot = {
  companies: Company[];
  pagination: PaginationMeta;
  fetchedAt: number;
};

let snapshot: StartupsDirectorySnapshot | null = null;
let fetchPromise: Promise<StartupsDirectorySnapshot> | null = null;

export function getCachedStartupsDirectory(): StartupsDirectorySnapshot | null {
  return snapshot;
}

export function isStartupsDirectoryCacheFresh(): boolean {
  return Boolean(
    snapshot && Date.now() - snapshot.fetchedAt < STARTUPS_DIRECTORY_STALE_MS,
  );
}

export function invalidateStartupsDirectoryCache(): void {
  snapshot = null;
  fetchPromise = null;
}

async function loadStartupsDirectory(
  force: boolean,
): Promise<StartupsDirectorySnapshot> {
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
