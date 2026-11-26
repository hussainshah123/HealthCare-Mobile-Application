import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth';
import { onSessionExpired } from '../api/client';
import { disconnectAllSockets } from '../socket/client';
import { tokenStorage } from './tokenStorage';
import type { AuthResponse, LoginBody, RegisterBody, User } from '../types';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (body: LoginBody) => Promise<User>;
  register: (body: RegisterBody) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-fetches GET /auth/me (e.g. to see if an admin approved the account). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signOutLocally = useCallback(async () => {
    disconnectAllSockets();
    await tokenStorage.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Restore session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await tokenStorage.load();
        if (!session) {
          if (!cancelled) {
            setStatus('signedOut');
          }
          return;
        }
        if (session.user && !cancelled) {
          setUser(session.user);
          setStatus('signedIn');
        }
        // Validate token / get fresh user (the client refreshes on 401).
        try {
          const me = await authApi.me();
          await tokenStorage.saveUser(me);
          if (!cancelled) {
            setUser(me);
            setStatus('signedIn');
          }
        } catch {
          // Offline: keep the cached user if we have one.
          if (!cancelled && !tokenStorage.get()) {
            setUser(null);
            setStatus('signedOut');
          } else if (!cancelled && !session.user) {
            setStatus('signedOut');
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('signedOut');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh failure in the HTTP client => back to the login screen.
  useEffect(() => {
    onSessionExpired(() => {
      disconnectAllSockets();
      setUser(null);
      setStatus('signedOut');
    });
    return () => onSessionExpired(null);
  }, []);

  const applyAuth = useCallback(async (res: AuthResponse) => {
    await tokenStorage.save({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    });
    setUser(res.user);
    setStatus('signedIn');
    return res.user;
  }, []);

  const login = useCallback(
    async (body: LoginBody) => applyAuth(await authApi.login(body)),
    [applyAuth],
  );

  const register = useCallback(
    async (body: RegisterBody) => applyAuth(await authApi.register(body)),
    [applyAuth],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore - we sign out locally regardless
      }
    }
    await signOutLocally();
  }, [signOutLocally]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    await tokenStorage.saveUser(me);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, refreshUser }),
    [status, user, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
