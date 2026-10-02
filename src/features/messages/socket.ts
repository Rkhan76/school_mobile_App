import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../config';
import { getAccessToken } from '../../lib/apiClient';

export type ChatSocketEvent =
  | 'message:new'
  | 'message:deleted'
  | 'member:added'
  | 'member:removed'
  | 'read:updated'
  | 'typing';

let socket: Socket | null = null;

/** `API_BASE_URL` already includes `/api/v1` — the socket connects to the bare origin. */
function chatOrigin(): string {
  return new URL(API_BASE_URL).origin;
}

/**
 * Singleton connection, reused across the whole messages feature.
 * `auth` is passed as a function so every (re)connect — including the
 * automatic ones socket.io-client does on transient drops — reads the
 * CURRENT access token rather than one captured at first connect. This
 * matters because access tokens are short-lived (~15 min) while the socket
 * may stay open far longer, and the server re-verifies the token every 5 min.
 */
export function connectChatSocket(): Socket {
  if (socket) return socket;
  socket = io(chatOrigin(), {
    auth: (cb) => cb({ token: getAccessToken() }),
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
  });
  return socket;
}

export function disconnectChatSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

// Client-side throttle for the one event we ever emit — the server also
// rate-limits at 5/3s per connection, but there's no point emitting faster
// than that and relying on the server to silently drop the excess.
const TYPING_THROTTLE_MS = 1000;
let lastTypingEmitAt = 0;

export function emitTyping(groupId: string): void {
  if (!socket) return;
  const now = Date.now();
  if (now - lastTypingEmitAt < TYPING_THROTTLE_MS) return;
  lastTypingEmitAt = now;
  socket.emit('typing', { groupId });
}

/** Subscribe to a chat event; connects the socket lazily if needed. Returns an unsubscribe function. */
export function onChatEvent<T = unknown>(
  event: ChatSocketEvent,
  handler: (payload: T) => void
): () => void {
  const s = connectChatSocket();
  s.on(event, handler as (...args: unknown[]) => void);
  return () => {
    s.off(event, handler as (...args: unknown[]) => void);
  };
}
