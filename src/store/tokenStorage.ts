import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

const KEYS = {
  access: 'auth.accessToken',
  refresh: 'auth.refreshToken',
  user: 'auth.user',
};

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: User | null;
}

/**
 * Tokens are cached in memory (read synchronously by the axios interceptor and
 * socket helpers) and persisted to AsyncStorage.
 */
let memory: StoredSession | null = null;

type Listener = (session: StoredSession | null) => void;
const listeners = new Set<Listener>();

export const tokenStorage = {
  get(): StoredSession | null {
    return memory;
  },
  getAccessToken(): string | null {
    return memory?.accessToken ?? null;
  },
  getRefreshToken(): string | null {
    return memory?.refreshToken ?? null;
  },

  async load(): Promise<StoredSession | null> {
    const values = await AsyncStorage.getMany([
      KEYS.access,
      KEYS.refresh,
      KEYS.user,
    ]);
    const accessToken = values[KEYS.access];
    const refreshToken = values[KEYS.refresh];
    if (!accessToken || !refreshToken) {
      memory = null;
      return null;
    }
    let user: User | null = null;
    try {
      user = values[KEYS.user]
        ? (JSON.parse(values[KEYS.user] as string) as User)
        : null;
    } catch {
      user = null;
    }
    memory = { accessToken, refreshToken, user };
    return memory;
  },

  async save(session: StoredSession): Promise<void> {
    memory = session;
    const entries: Record<string, string> = {
      [KEYS.access]: session.accessToken,
      [KEYS.refresh]: session.refreshToken,
    };
    if (session.user) {
      entries[KEYS.user] = JSON.stringify(session.user);
    }
    await AsyncStorage.setMany(entries);
    listeners.forEach(l => l(memory));
  },

  async saveUser(user: User): Promise<void> {
    if (memory) {
      memory = { ...memory, user };
    }
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    memory = null;
    await AsyncStorage.removeMany([KEYS.access, KEYS.refresh, KEYS.user]);
    listeners.forEach(l => l(null));
  },

  /** Notified after tokens are saved (e.g. refreshed) or cleared. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
