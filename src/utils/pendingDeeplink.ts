/**
 * Stores a deeplink URL when the user opens the app before auth + profile are ready.
 * Replay via DeeplinkReplayHandler after MainNavigator is active.
 */
let pendingUrl: string | null = null;

export function capturePendingDeeplink(url: string): void {
  const trimmed = url?.trim();
  if (!trimmed) return;
  pendingUrl = trimmed;
}

export function peekPendingDeeplink(): string | null {
  return pendingUrl;
}

export function consumePendingDeeplink(): string | null {
  const url = pendingUrl;
  pendingUrl = null;
  return url;
}

export function clearPendingDeeplink(): void {
  pendingUrl = null;
}
