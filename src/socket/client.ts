import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { refreshAccessToken } from '../api/client';
import { tokenStorage } from '../store/tokenStorage';

export type Namespace = '/tracking' | '/consultations' | '/notifications';

const sockets = new Map<Namespace, Socket>();

/**
 * Returns a shared, lazily-connected socket for a namespace.
 * API.md: connect to `http://<host>:3000/<ns>` with `auth: { token }`.
 * `auth` is a callback so reconnects always pick up the latest (refreshed) token.
 */
export function getSocket(ns: Namespace): Socket {
  let socket = sockets.get(ns);
  if (!socket) {
    socket = io(`${SOCKET_URL}${ns}`, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: cb => cb({ token: tokenStorage.getAccessToken() }),
    });
    const s = socket;
    // If the server rejects the handshake (expired token), refresh once and retry.
    let refreshing = false;
    s.on('connect_error', async err => {
      const msg = String(err?.message ?? '').toLowerCase();
      if (
        !refreshing &&
        (msg.includes('unauthor') ||
          msg.includes('jwt') ||
          msg.includes('token'))
      ) {
        refreshing = true;
        try {
          await refreshAccessToken();
          s.connect();
        } catch {
          // session expired; the auth store will log out on the next HTTP 401
        } finally {
          refreshing = false;
        }
      }
    });
    sockets.set(ns, socket);
  }
  if (!socket.connected && tokenStorage.getAccessToken()) {
    socket.connect();
  }
  return socket;
}

/** Disconnects and forgets every namespace socket (on logout). */
export function disconnectAllSockets() {
  sockets.forEach(s => {
    s.removeAllListeners();
    s.disconnect();
  });
  sockets.clear();
}
