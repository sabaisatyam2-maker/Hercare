import { useRef, useState } from 'react';
import { useApi, useDebounced } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { categoryApi, recipeApi } from '../api/services';
import { DIET_TAGS } from '../utils/constants';
import { humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { PageHeader, Pagination } from '../components/Media';
import { RecipeCard, CardGrid } from '../components/Cards';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { Button } from '../components/Button';

const PAGE_SIZE = 12;

export default function Recipes() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [dietTag, setDietTag] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(keyword.trim(), 400);
  const gridRef = useRef(null);

  const cats = useApi((signal) => categoryApi.list('recipe', signal), []);
  const { data, loading, error, reload } = useApi((signal) => {
    const params = {};
    if (debounced) params.keyword = debounced;
    if (category) params.category = category;
    if (dietTag) params.dietTag = dietTag;
    return recipeApi.list(params, signal);
  }, [debounced, category, dietTag]);

  const all = data?.recipes || [];
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useStagger(gridRef, [visible.map((r) => r._id).join(',')]);

  const filtersActive = keyword || category || dietTag;
  const reset = () => { setKeyword(''); setCategory(''); setDietTag(''); setPage(1); };

  return (
    <Container>
      <PageHeader title="Recipes" subtitle="Nourishing, PCOS-friendly meals with clear steps." />

      <div className="card p-4 sm:p-5 mb-8 grid gap-4 md:grid-cols-[1fr_220px]">
        <input className="input" placeholder="Search recipes..." value={keyword} aria-label="Search recipes"
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        <select className="input" value={category} aria-label="Category"
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {(Array.isArray(cats.data) ? cats.data : []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
          {DIET_TAGS.map((t) => (
            <button key={t} type="button" aria-pressed={dietTag === t}
              onClick={() => { setDietTag(dietTag === t ? '' : t); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${dietTag === t ? 'bg-lavender-500 border-lavender-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-lavender-300'}`}>
              {humanize(t)}
            </button>
          ))}
          {filtersActive && <button onClick={reset} className="text-xs font-semibold text-rose-500 hover:underline ml-1">Clear filters</button>}
        </div>
      </div>

      {loading && <Loading label="Finding recipes..." />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && all.length === 0 && (
        <EmptyState emoji="🍽️" title="No recipes found"
          text={filtersActive ? 'Try a different search or clear your filters.' : 'New recipes will appear here soon.'}
          action={filtersActive && <Button variant="outline" onClick={reset}>Clear filters</Button>} />
      )}
      {!loading && !error && visible.length > 0 && (
        <>
          <p className="text-sm text-ink-400 mb-4">{all.length} recipe{all.length > 1 ? 's' : ''}</p>
          <div ref={gridRef}>
            <CardGrid>{visible.map((r) => <RecipeCard key={r._id} recipe={r} />)}</CardGrid>
          </div>
          <Pagination page={current} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      )}
    </Container>
  );
}
