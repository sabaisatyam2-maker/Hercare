import { Button, Spinner } from './Button';

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-400 gap-3">
      <Spinner className="h-8 w-8 text-rose-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-8 text-center max-w-md mx-auto my-10">
      <div className="text-4xl mb-3">🌧️</div>
      <p className="text-ink-600 mb-4">{message || 'Something went wrong.'}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ emoji = '🌸', title, text, action }) {
  return (
    <div className="card p-10 text-center max-w-lg mx-auto my-8">
      <div className="text-5xl mb-3">{emoji}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      {text && <p className="text-ink-600 text-sm mb-5">{text}</p>}
      {action}
    </div>
  );
}
