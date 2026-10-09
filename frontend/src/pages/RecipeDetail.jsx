import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { recipeApi } from '../api/services';
import { humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { Media } from '../components/Media';
import { FavoriteButton } from '../components/FavoriteButton';
import { Icon } from '../components/Icon';
import { Loading, ErrorState } from '../components/States';

export default function RecipeDetail() {
  const { id } = useParams();
  const ref = useRef(null);
  const [checked, setChecked] = useState({});
  const { data, loading, error, reload } = useApi((s) => recipeApi.get(id, s), [id]);
  const recipe = data?.recipe;

  useStagger(ref, [recipe?._id]);

  if (loading) return <Container><Loading /></Container>;
  if (error || !recipe) return <Container><ErrorState message={error || 'Recipe not found.'} onRetry={reload} /></Container>;

  return (
    <Container>
      <div ref={ref} className="max-w-5xl mx-auto">
        <Link to="/recipes" className="text-sm font-semibold text-ink-400 hover:text-rose-500">&larr; All recipes</Link>

        <div data-anim className="card overflow-hidden mt-4 grid md:grid-cols-2">
          <div className="relative min-h-64 md:min-h-96">
            <div className="absolute inset-0"><Media src={recipe.image?.url} alt={recipe.title} emoji="🥗" seed={recipe._id} /></div>
          </div>
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                {recipe.category?.name && <p className="text-xs font-bold uppercase tracking-wide text-lavender-500">{recipe.category.name}</p>}
                <h1 className="text-3xl font-extrabold tracking-tight mt-1">{recipe.title}</h1>
              </div>
              <FavoriteButton type="recipe" id={recipe._id} className="!bg-rose-50 shrink-0" />
            </div>
            <p className="text-ink-600 mt-4 leading-relaxed">{recipe.description}</p>
            <div className="flex flex-wrap gap-5 mt-6 text-sm text-ink-600">
              <span className="inline-flex items-center gap-2"><Icon name="clock" /> {recipe.prepTimeMinutes} min</span>
              <span className="inline-flex items-center gap-2"><Icon name="users" /> {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
            </div>
            {recipe.dietTags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {recipe.dietTags.map((t) => <span key={t} className="chip">{humanize(t)}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mt-6">
          <section data-anim className="card p-6 md:col-span-2 h-fit">
            <h2 className="text-xl font-bold mb-4">Ingredients</h2>
            <ul className="space-y-2.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  <label className="flex items-start gap-3 cursor-pointer text-sm">
                    <input type="checkbox" className="mt-0.5 accent-rose-500 w-4 h-4"
                      checked={!!checked[i]} onChange={() => setChecked({ ...checked, [i]: !checked[i] })} />
                    <span className={checked[i] ? 'line-through text-ink-400' : ''}>{ing}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section data-anim className="card p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4">Method</h2>
            <ol className="space-y-5">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-bold text-sm grid place-items-center">{i + 1}</span>
                  <p className="text-sm text-ink-600 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </Container>
  );
}
