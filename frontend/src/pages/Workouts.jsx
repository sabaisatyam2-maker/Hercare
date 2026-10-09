import { useRef, useState } from 'react';
import { useApi, useDebounced } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { categoryApi, workoutApi } from '../api/services';
import { DIFFICULTIES, INTENSITIES } from '../utils/constants';
import { humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { PageHeader, Pagination } from '../components/Media';
import { WorkoutCard, CardGrid } from '../components/Cards';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { Button } from '../components/Button';

const PAGE_SIZE = 12;

export default function Workouts() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [intensity, setIntensity] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(keyword.trim(), 400);
  const gridRef = useRef(null);

  const cats = useApi((signal) => categoryApi.list('workout', signal), []);
  const { data, loading, error, reload } = useApi((signal) => {
    const params = {};
    if (debounced) params.keyword = debounced;
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (intensity) params.intensity = intensity;
    return workoutApi.list(params, signal);
  }, [debounced, category, difficulty, intensity]);

  const all = data?.workouts || [];
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useStagger(gridRef, [visible.map((w) => w._id).join(',')]);

  const filtersActive = keyword || category || difficulty || intensity;
  const reset = () => { setKeyword(''); setCategory(''); setDifficulty(''); setIntensity(''); setPage(1); };
  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <Container>
      <PageHeader title="Workouts" subtitle="Movement that respects your energy - from gentle stretches to strength." />

      <div className="card p-4 sm:p-5 mb-8 grid gap-4 md:grid-cols-4">
        <input className="input md:col-span-4" placeholder="Search workouts..." value={keyword} aria-label="Search workouts"
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        <select className="input" value={category} onChange={onFilter(setCategory)} aria-label="Category">
          <option value="">All categories</option>
          {(Array.isArray(cats.data) ? cats.data : []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input" value={difficulty} onChange={onFilter(setDifficulty)} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
        </select>
        <select className="input" value={intensity} onChange={onFilter(setIntensity)} aria-label="Intensity">
          <option value="">Any intensity</option>
          {INTENSITIES.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
        </select>
        {filtersActive && <Button variant="ghost" onClick={reset}>Clear filters</Button>}
      </div>

      {loading && <Loading label="Finding workouts..." />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && all.length === 0 && (
        <EmptyState emoji="🧘‍♀️" title="No workouts found"
          text={filtersActive ? 'Try different filters.' : 'New workouts will appear here soon.'}
          action={filtersActive && <Button variant="outline" onClick={reset}>Clear filters</Button>} />
      )}
      {!loading && !error && visible.length > 0 && (
        <>
          <p className="text-sm text-ink-400 mb-4">{all.length} workout{all.length > 1 ? 's' : ''}</p>
          <div ref={gridRef}>
            <CardGrid>{visible.map((w) => <WorkoutCard key={w._id} workout={w} />)}</CardGrid>
          </div>
          <Pagination page={current} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}
    </Container>
  );
}
