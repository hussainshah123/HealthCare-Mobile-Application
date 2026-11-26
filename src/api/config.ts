/** Temporary Cloudflare Quick Tunnel; replace with a stable API host for production. */
const SERVER_HOST =
  'https://rugby-translate-perception-trackbacks.trycloudflare.com';

export const SERVER_URL: string = SERVER_HOST;

/** REST base URL (API.md: `http://<host>:3000/api`). */
export const API_BASE_URL = `${SERVER_URL}/api`;

/** Socket.IO connects to the server root; namespaces are appended. */
export const SOCKET_URL = SERVER_URL;

export const REQUEST_TIMEOUT_MS = 20000;
