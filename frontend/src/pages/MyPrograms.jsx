import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { enrollmentApi } from '../api/services';
import { Container } from '../components/Layouts';
import { Media, PageHeader, ProgressBar } from '../components/Media';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, Loading } from '../components/States';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'abandoned', label: 'Stopped' },
];

export default function MyPrograms() {
  const [tab, setTab] = useState('active');
  const ref = useRef(null);
  const { data, loading, error, reload } = useApi((s) => enrollmentApi.list(tab, s), [tab]);
  const items = data?.enrollments || [];

  useStagger(ref, [items.map((e) => e._id).join(','), tab]);

  return (
    <Container>
      <PageHeader title="My programs" subtitle="Keep going, one day at a time.">
        <Button to="/programs" variant="secondary">Find a program</Button>
      </PageHeader>

      <div className="flex gap-2 mb-6" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all
              ${tab === t.key ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-rose-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState emoji={tab === 'completed' ? '🏆' : '📅'}
          title={tab === 'active' ? 'No active programs' : tab === 'completed' ? 'Nothing completed yet' : 'Nothing here'}
          text={tab === 'active' ? 'Start a program and it will show up here.' : undefined}
          action={tab === 'active' && <Button to="/programs">Browse programs</Button>} />
      )}
      {!loading && !error && items.length > 0 && (
        <div ref={ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Link key={e._id} to={`/my-programs/${e._id}`} data-anim
              className="card overflow-hidden block hover:-translate-y-1 transition-transform">
              <div className="aspect-16/8"><Media src={e.program?.image?.url} alt="" emoji="📅" seed={e._id} /></div>
              <div className="p-5">
                <h3 className="font-bold text-lg line-clamp-1">{e.program?.title}</h3>
                <p className="text-sm text-ink-600 mt-1">
                  {e.status === 'active' ? `Day ${e.currentDay} of ${e.program?.durationDays}` :
                    e.status === 'completed' ? 'Completed 🎉' : `Stopped at ${e.completedDays?.length || 0} of ${e.program?.durationDays} days`}
                </p>
                <ProgressBar value={e.progressPercent} className="mt-3" />
                <p className="text-xs text-ink-400 mt-2">{e.progressPercent}% complete</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
