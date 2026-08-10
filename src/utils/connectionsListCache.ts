/**
 * Shared in-memory cache for connections list (messaging eligibility, Connections tab).
 */

import {
  connectionService,
  type Connection,
} from "../services/connectionService";
import type { PaginationMeta } from "../services/api";
import { FOCUS_LIST_STALE_MS } from "./eventDataCache";

/** Canonical page size for cache (covers inbox filter + Connections tab). */
export const CONNECTIONS_CACHE_PAGE_SIZE = 200;

export type ConnectionsListSnapshot = {
  connections: Connection[];
  pagination: PaginationMeta;
  fetchedAt: number;
};

let snapshot: ConnectionsListSnapshot | null = null;
let fetchPromise: Promise<ConnectionsListSnapshot> | null = null;

export function getCachedConnectionsList(): ConnectionsListSnapshot | null {
  return snapshot;
}

export function getCachedConnections(): Connection[] {
  return snapshot?.connections ?? [];
}

export function isConnectionsListCacheFresh(): boolean {
  if (!snapshot) return false;
  return Date.now() - snapshot.fetchedAt < FOCUS_LIST_STALE_MS;
}

export function shouldRefetchConnectionsOnFocus(hasLocalData: boolean): boolean {
  if (!hasLocalData) return true;
  return !isConnectionsListCacheFresh();
}

export function markConnectionsFetched(): void {
  if (snapshot) {
    snapshot = { ...snapshot, fetchedAt: Date.now() };
  }
}

export function setConnectionsListCache(
  connections: Connection[],
  pagination: PaginationMeta,
): void {
  snapshot = {
    connections,
    pagination,
    fetchedAt: Date.now(),
  };
}

export function invalidateConnectionsListCache(): void {
  snapshot = null;
  fetchPromise = null;
}

async function loadConnectionsFromApi(
  force: boolean,
): Promise<ConnectionsListSnapshot> {
  if (!force && isConnectionsListCacheFresh() && snapshot) {
    return snapshot;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    const response = await connectionService.getConnections(
      1,
      CONNECTIONS_CACHE_PAGE_SIZE,
    );
    setConnectionsListCache(response.connections, response.pagination);
    return snapshot!;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

/** Load connections; returns cache when fresh unless `force`. Dedupes in-flight requests. */
export function ensureConnectionsList(options?: {
  force?: boolean;
}): Promise<ConnectionsListSnapshot> {
  return loadConnectionsFromApi(options?.force ?? false);
}
