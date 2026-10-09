import { useRef, useState } from 'react';
import { useApi, useDebounced } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { programApi } from '../api/services';
import { DURATIONS } from '../utils/constants';
import { Container } from '../components/Layouts';
import { PageHeader } from '../components/Media';
import { ProgramCard, CardGrid } from '../components/Cards';
import { Loading, ErrorState, EmptyState } from '../components/States';

export default function Programs() {
  const [keyword, setKeyword] = useState('');
  const [duration, setDuration] = useState('');
  const debounced = useDebounced(keyword.trim(), 400);
  const gridRef = useRef(null);

  const { data, loading, error, reload } = useApi((signal) => {
    const params = {};
    if (debounced) params.keyword = debounced;
    if (duration) params.durationDays = duration;
    return programApi.list(params, signal);
  }, [debounced, duration]);

  const programs = data?.programs || [];
  useStagger(gridRef, [programs.map((p) => p._id).join(',')]);

  return (
    <Container>
      <PageHeader title="Programs" subtitle="Structured plans that combine food, movement and small daily habits." />

      <div className="card p-4 sm:p-5 mb-8 flex flex-col md:flex-row gap-4">
        <input className="input flex-1" placeholder="Search programs..." value={keyword} aria-label="Search programs"
          onChange={(e) => setKeyword(e.target.value)} />
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={() => setDuration('')} aria-pressed={duration === ''}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${duration === '' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-ink-200 text-ink-600'}`}>
            All
          </button>
          {DURATIONS.map((d) => (
            <button key={d} type="button" onClick={() => setDuration(String(d))} aria-pressed={duration === String(d)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${duration === String(d) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-rose-200'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading && <Loading label="Loading programs..." />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && programs.length === 0 && (
        <EmptyState emoji="📅" title="No programs found" text="Try another length or search term." />
      )}
      {!loading && !error && programs.length > 0 && (
        <div ref={gridRef}><CardGrid>{programs.map((p) => <ProgramCard key={p._id} program={p} />)}</CardGrid></div>
      )}
    </Container>
  );
}
