import { Link } from 'react-router-dom';
import { Alert } from './Alert';
import { Button } from './Button';

export function FormShell({ title, backTo, backLabel, onSubmit, saving, error, submitLabel, children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Link to={backTo} className="text-sm font-semibold text-ink-400 hover:text-rose-500">&larr; {backLabel}</Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-6">{title}</h1>
      <form onSubmit={onSubmit} noValidate className="card p-5 sm:p-8">
        <Alert type="error">{error}</Alert>
        {children}
        <div className="flex gap-3 justify-end pt-4 border-t border-ink-100 mt-2">
          <Button to={backTo} variant="ghost">Cancel</Button>
          <Button type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      </form>
    </div>
  );
}
