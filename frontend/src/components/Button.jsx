import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200 active:scale-[0.98]',
  secondary: 'bg-lavender-100 text-lavender-600 hover:bg-lavender-200 active:scale-[0.98]',
  outline: 'bg-white text-ink-600 border border-ink-200 hover:border-rose-300 hover:text-rose-600',
  ghost: 'bg-transparent text-ink-600 hover:bg-rose-50 hover:text-rose-600',
  danger: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50',
};
const SIZES = { md: 'py-2.5 px-4 text-sm', sm: 'py-1.5 px-3 text-xs', lg: 'py-3 px-6 text-base' };

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

/** Renders a <button>, or a router <Link> when `to` is given (no nested anchors). */
export function Button({
  children, variant = 'primary', size = 'md', loading = false, disabled = false,
  full = false, className = '', to, ...props
}) {
  const isDisabled = loading || disabled;
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all
    ${full ? 'w-full' : ''} ${SIZES[size]} ${VARIANTS[variant]}
    ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''} ${className}`;

  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>;
  return (
    <button className={cls} disabled={isDisabled} {...props}>
      {loading ? (<><Spinner className="h-4 w-4" /> Please wait...</>) : children}
    </button>
  );
}
