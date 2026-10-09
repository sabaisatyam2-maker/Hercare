import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { favoriteApi } from '../api/services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../utils/format';

const FavoritesContext = createContext(null);
const key = (type, id) => `${type}:${id}`;

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState(() => new Set());
  const userId = user?._id;

  useEffect(() => {
    if (!userId) { setKeys(new Set()); return undefined; }
    let cancelled = false;
    favoriteApi.list()
      .then((res) => {
        if (cancelled) return;
        setKeys(new Set((res.favorites || []).map((f) => key(f.itemType, f.item?._id))));
      })
      .catch(() => { /* hearts simply start empty */ });
    return () => { cancelled = true; };
  }, [userId]);

  const isFav = useCallback((type, id) => keys.has(key(type, id)), [keys]);

  const toggle = useCallback(async (type, id) => {
    if (!userId) return { needsLogin: true };
    const k = key(type, id);
    const had = keys.has(k);
    // Optimistic update, rolled back on failure.
    setKeys((prev) => { const n = new Set(prev); if (had) n.delete(k); else n.add(k); return n; });
    try {
      if (had) await favoriteApi.remove(type, id); else await favoriteApi.add(type, id);
      return { ok: true, added: !had };
    } catch (err) {
      const msg = getErrorMessage(err);
      if (err.response?.status === 409) return { ok: true, added: true }; // already a favorite
      setKeys((prev) => { const n = new Set(prev); if (had) n.add(k); else n.delete(k); return n; });
      toast.error(msg);
      return { ok: false };
    }
  }, [keys, userId, toast]);

  const value = useMemo(() => ({ isFav, toggle, count: keys.size }), [isFav, toggle, keys]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoritesContext);
