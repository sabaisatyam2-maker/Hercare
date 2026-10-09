import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  const styles = {
    success: 'bg-white border-green-200 text-green-800',
    error: 'bg-white border-rose-200 text-rose-700',
    info: 'bg-white border-lavender-200 text-lavender-600',
  };
  const icons = { success: '✓', error: '!', info: 'i' };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-96 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm ${styles[t.type]}`}>
            <span className="font-bold w-5 h-5 rounded-full bg-current/10 grid place-items-center text-xs shrink-0">{icons[t.type]}</span>
            <p className="flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-ink-400 hover:text-ink-900">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
