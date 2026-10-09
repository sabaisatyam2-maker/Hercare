import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { axiosPlain, setAccessToken, setLogoutCallback } from '../api/axios';
import { PROFILE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

const pickUser = (u) => {
  if (!u) return null;
  const base = {
    _id: u._id, name: u.name, email: u.email, role: u.role,
    onboardingCompleted: !!u.onboardingCompleted,
  };
  PROFILE_KEYS.forEach((k) => { if (u[k] !== undefined) base[k] = u[k]; });
  return base;
};

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const restored = useRef(false);

  const clearSession = useCallback(() => {
    setUserState(null);
    setAccessToken(null);
  }, []);

  // Merge partial user data (e.g. after onboarding) without losing other fields.
  const updateUser = useCallback((patch) => {
    setUserState((prev) => (prev ? { ...prev, ...pickUser({ ...prev, ...patch }) } : prev));
  }, []);

  // The login/refresh responses only carry basic fields; /auth/me has the full profile.
  const loadProfile = useCallback(async (basicUser) => {
    let merged = pickUser(basicUser);
    try {
      const { data } = await api.get('/auth/me');
      merged = pickUser({ ...basicUser, ...(data.user || data) });
    } catch {
      /* basic info is enough to continue */
    }
    setUserState(merged);
    return merged;
  }, []);

  useEffect(() => {
    setLogoutCallback(clearSession);
    if (restored.current) return;
    restored.current = true;

    (async () => {
      try {
        const { data } = await axiosPlain.post('/auth/refresh-token');
        setAccessToken(data.accessToken);
        await loadProfile(data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession, loadProfile]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    return loadProfile(data.user);
  }, [loadProfile]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* clear locally regardless */ }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser, isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
