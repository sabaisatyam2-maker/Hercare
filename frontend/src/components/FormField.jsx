import { useState } from 'react';

export function FormField({ label, name, type = 'text', error, hint, className = '', ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-ink-600 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <input id={name} name={name} type={inputType}
          className={`input ${error ? '!border-rose-500' : ''} ${isPassword ? 'pr-16' : ''}`}
          aria-invalid={!!error} {...props} />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400 hover:text-ink-900">
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
    </div>
  );
}

export function SelectField({ label, name, error, children, className = '', ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label htmlFor={name} className="block text-sm font-medium text-ink-600 mb-1.5">{label}</label>}
      <select id={name} name={name} className={`input ${error ? '!border-rose-500' : ''}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
    </div>
  );
}

export function TextArea({ label, name, error, className = '', rows = 4, ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label htmlFor={name} className="block text-sm font-medium text-ink-600 mb-1.5">{label}</label>}
      <textarea id={name} name={name} rows={rows} className={`input resize-y ${error ? '!border-rose-500' : ''}`} {...props} />
      {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
    </div>
  );
}
