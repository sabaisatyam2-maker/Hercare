import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/format';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Media, Pagination } from '../../components/Media';
import { StatusBadge } from '../../components/AdminUI';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState, ErrorState, Loading } from '../../components/States';

const LIMIT = 10;

/** Shared admin table for recipes / workouts / programs. */
export default function AdminResourceList({ title, noun, basePath, itemsKey, listFn, removeFn, emoji, meta }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounced = useDebounced(q.trim(), 400);

  const { data, loading, error, reload } = useApi((signal) => {
    const params = { page, limit: LIMIT };
    if (debounced) params.q = debounced;
    if (status) params.isPublished = status;
    return listFn(params, signal);
  }, [page, debounced, status]);

  const items = data?.[itemsKey] || [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await removeFn(toDelete._id);
      toast.success(`${noun} deleted.`);
      setToDelete(null);
      // Step back a page if we just removed the last item on this page.
      if (items.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "used in 1 program(s)"
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
          {data && <p className="text-sm text-ink-400 mt-1">{data.total} total</p>}
        </div>
        <Button to={`${basePath}/new`}><Icon name="plus" className="w-4 h-4" /> New {noun.toLowerCase()}</Button>
      </div>

      <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <input className="input flex-1" placeholder={`Search ${title.toLowerCase()}...`} value={q} aria-label="Search"
          onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="input sm:!w-44" value={status} aria-label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      {loading && <Loading />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState emoji={emoji} title={`No ${title.toLowerCase()} found`}
          text={q || status ? 'Try changing your search or filter.' : `Create your first ${noun.toLowerCase()}.`}
          action={!q && !status && <Button to={`${basePath}/new`}>New {noun.toLowerCase()}</Button>} />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="card overflow-hidden divide-y divide-ink-100">
            {items.map((it) => (
              <div key={it._id} className="flex items-center gap-4 p-4 hover:bg-rose-50/30 transition-colors">
                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0"><Media src={it.image?.url} alt="" emoji={emoji} seed={it._id} className="!text-2xl" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{it.title}</p>
                  <p className="text-xs text-ink-400 truncate">{meta(it)}</p>
                </div>
                <div className="hidden sm:block"><StatusBadge published={it.isPublished} /></div>
                <div className="flex gap-1 shrink-0">
                  <Link to={`${basePath}/${it._id}/edit`} aria-label={`Edit ${it.title}`} className="p-2 rounded-lg text-ink-400 hover:text-lavender-600 hover:bg-lavender-50"><Icon name="edit" className="w-5 h-5" /></Link>
                  <button onClick={() => setToDelete(it)} aria-label={`Delete ${it.title}`} className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50"><Icon name="trash" className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog open={!!toDelete} danger loading={deleting} confirmLabel="Delete"
        title={`Delete ${noun.toLowerCase()}?`}
        message={`"${toDelete?.title}" will be permanently removed. This cannot be undone.`}
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
