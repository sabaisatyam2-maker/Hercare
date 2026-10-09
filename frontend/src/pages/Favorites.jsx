import { useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { favoriteApi } from '../api/services';
import { useFavorites } from '../context/FavoritesContext';
import { Container } from '../components/Layouts';
import { PageHeader } from '../components/Media';
import { RecipeCard, WorkoutCard, CardGrid } from '../components/Cards';
import { Button } from '../components/Button';
import { EmptyState, ErrorState, Loading } from '../components/States';

const TABS = [
  { key: '', label: 'All' },
  { key: 'recipe', label: 'Recipes' },
  { key: 'workout', label: 'Workouts' },
];

export default function Favorites() {
  const [tab, setTab] = useState('');
  const ref = useRef(null);
  const { data, loading, error, reload } = useApi((s) => favoriteApi.list(tab, s), [tab]);
  const { isFav } = useFavorites();
  // Hearts toggled off on this page disappear straight away.
  const items = (data?.favorites || []).filter((f) => f.item && isFav(f.itemType, f.item._id));

  useStagger(ref, [items.map((f) => f._id).join(','), tab]);

  return (
    <Container>
      <PageHeader title="Favorites" subtitle="Your saved recipes and workouts." />

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all
              ${tab === t.key ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-rose-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState emoji="💗" title="No favorites yet" text="Tap the heart on any recipe or workout to save it here."
          action={<div className="flex gap-3 justify-center"><Button to="/recipes" variant="secondary">Recipes</Button><Button to="/workouts" variant="secondary">Workouts</Button></div>} />
      )}
      {!loading && !error && items.length > 0 && (
        <div ref={ref}>
          <CardGrid>
            {items.map((f) => f.itemType === 'recipe'
              ? <RecipeCard key={f._id} recipe={f.item} />
              : <WorkoutCard key={f._id} workout={f.item} />)}
          </CardGrid>
        </div>
      )}
    </Container>
  );
}
