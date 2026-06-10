/**
 * Lightweight pub/sub so ConversationScreen / ChatContext can update inbox order
 * and read state without tight coupling to MessagesScreen.
 */

export type InboxBumpEvent = {
  conversationId: number;
  content: string;
  timestamp?: string;
  /** When true, inbox row stays at top but unread badge unchanged (own send). */
  fromSelf?: boolean;
};

export type InboxReadEvent = {
  conversationId: number;
};

type BumpListener = (event: InboxBumpEvent) => void;
type ReadListener = (event: InboxReadEvent) => void;

const bumpListeners = new Set<BumpListener>();
const readListeners = new Set<ReadListener>();

export function subscribeInboxBump(listener: BumpListener): () => void {
  bumpListeners.add(listener);
  return () => bumpListeners.delete(listener);
}

export function emitInboxBump(event: InboxBumpEvent): void {
  bumpListeners.forEach((fn) => fn(event));
}

export function subscribeInboxRead(listener: ReadListener): () => void {
  readListeners.add(listener);
  return () => readListeners.delete(listener);
}

export function emitInboxRead(event: InboxReadEvent): void {
  readListeners.forEach((fn) => fn(event));
}
