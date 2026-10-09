import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { categoryApi } from '../../api/services';
import { getErrorMessage } from '../../utils/format';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState, Loading } from '../../components/States';

function CategoryColumn({ type, title, emoji, items, onChanged }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setAdding(true);
    try {
      await categoryApi.create({ name: n, type });
      setName('');
      toast.success('Category added.');
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setAdding(false); }
  };

  const saveEdit = async (c) => {
    const n = editName.trim();
    if (!n) return;
    if (n === c.name) { setEditingId(null); return; }
    setBusy(true);
    try {
      await categoryApi.update(c._id, { name: n }); // type is never changed from the UI
      toast.success('Category renamed.');
      setEditingId(null);
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await categoryApi.remove(toDelete._id);
      toast.success('Category deleted.');
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); setToDelete(null); }
  };

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-bold text-lg mb-4">{emoji} {title}</h2>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="input" placeholder="New category name" value={name} maxLength={60}
          onChange={(e) => setName(e.target.value)} aria-label={`New ${type} category`} />
        <Button type="submit" loading={adding} disabled={!name.trim()}>Add</Button>
      </form>
      {items.length === 0 ? <p className="text-sm text-ink-400 py-4 text-center">No categories yet.</p> : (
        <ul className="divide-y divide-ink-100">
          {items.map((c) => (
            <li key={c._id} className="py-2.5 flex items-center gap-2">
              {editingId === c._id ? (
                <>
                  <input className="input !py-1.5" value={editName} autoFocus maxLength={60}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c); if (e.key === 'Escape') setEditingId(null); }} />
                  <Button size="sm" onClick={() => saveEdit(c)} loading={busy}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <button onClick={() => { setEditingId(c._id); setEditName(c.name); }} aria-label={`Rename ${c.name}`} className="p-2 text-ink-400 hover:text-lavender-600"><Icon name="edit" className="w-4 h-4" /></button>
                  <button onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`} className="p-2 text-ink-400 hover:text-rose-600"><Icon name="trash" className="w-4 h-4" /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!toDelete} danger loading={busy} confirmLabel="Delete" title="Delete category?"
        message={`"${toDelete?.name}" will be removed. Categories that still have items cannot be deleted.`}
        onConfirm={remove} onCancel={() => setToDelete(null)} />
    </div>
  );
}

export default function AdminCategories() {
  const { data, loading, error, reload } = useApi((s) => categoryApi.list(undefined, s), []);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const all = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Categories</h1>
      <p className="text-ink-600 mt-1 mb-8">Organise recipes and workouts so members can find them.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryColumn type="recipe" title="Recipe categories" emoji="🥗" items={all.filter((c) => c.type === 'recipe')} onChanged={reload} />
        <CategoryColumn type="workout" title="Workout categories" emoji="🧘‍♀️" items={all.filter((c) => c.type === 'workout')} onChanged={reload} />
      </div>
    </div>
  );
}
