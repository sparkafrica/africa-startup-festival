/**
 * Lightweight pub/sub so Home / Profile stay in sync after approve/decline.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeStartupJoinRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitStartupJoinRefresh(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore subscriber errors */
    }
  });
}
