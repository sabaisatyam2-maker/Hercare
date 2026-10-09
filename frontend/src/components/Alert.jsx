const STYLES = {
  error: 'bg-rose-50 text-rose-700 border-rose-100',
  success: 'bg-green-50 text-green-700 border-green-100',
  info: 'bg-lavender-50 text-lavender-600 border-lavender-100',
};

export function Alert({ type = 'error', children, className = '' }) {
  if (!children) return null;
  return (
    <div role={type === 'error' ? 'alert' : 'status'}
      className={`p-4 rounded-xl text-sm mb-5 border ${STYLES[type]} ${className}`}>
      {children}
    </div>
  );
}
