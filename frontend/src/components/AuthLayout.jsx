import { Link } from 'react-router-dom';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8 text-rose-500 font-extrabold text-3xl tracking-tight">🌸 HerCare</Link>
      <div className="card w-full max-w-md p-8">
        {title && <h1 className="text-2xl font-bold text-center">{title}</h1>}
        {subtitle && <p className="text-sm text-ink-600 text-center mt-2">{subtitle}</p>}
        <div className={title ? 'mt-6' : ''}>{children}</div>
      </div>
      <Link to="/" className="mt-8 text-sm font-medium text-ink-400 hover:text-ink-600 transition-colors">&larr; Back to home</Link>
    </div>
  );
}
