const GRADIENTS = [
  'from-rose-100 to-lavender-100', 'from-lavender-100 to-rose-100', 'from-rose-200 to-rose-50', 'from-lavender-200 to-lavender-50',
];

/** Image with a soft gradient + emoji placeholder when there is no image. */
export function Media({ src, alt = '', emoji = '🌸', seed = 0, className = '' }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`object-cover w-full h-full ${className}`} />;
  }
  const g = GRADIENTS[Math.abs(String(seed).charCodeAt(String(seed).length - 1) || 0) % GRADIENTS.length];
  return (
    <div className={`w-full h-full bg-linear-to-br ${g} grid place-items-center text-5xl ${className}`} aria-hidden="true">
      {emoji}
    </div>
  );
}

export function ProgressBar({ value = 0, className = '' }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 rounded-full bg-ink-100 overflow-hidden ${className}`} role="progressbar"
      aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-linear-to-r from-rose-400 to-lavender-400 transition-all duration-700"
        style={{ width: `${v}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-600 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button className="px-4 py-2 rounded-xl border border-ink-200 bg-white text-sm disabled:opacity-40"
        disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="text-sm text-ink-600">Page {page} of {pages}</span>
      <button className="px-4 py-2 rounded-xl border border-ink-200 bg-white text-sm disabled:opacity-40"
        disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
