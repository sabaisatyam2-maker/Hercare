import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/format';

/**
 * Runs `fn(signal)` whenever `deps` change. Stale responses are ignored.
 * Returns { data, loading, error, reload, setData }.
 */
export function useApi(fn, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) { setLoading(false); return undefined; }
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError('');
    fnRef.current(controller.signal)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => {
        if (cancelled || err?.code === 'ERR_CANCELED') return;
        setError(getErrorMessage(err));
        setData(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload, setData };
}

export function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
