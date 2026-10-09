import { Link } from 'react-router-dom';
import { Media } from './Media';
import { FavoriteButton } from './FavoriteButton';
import { Icon } from './Icon';
import { humanize } from '../utils/format';

export function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipes/${recipe._id}`} data-anim
      className="card overflow-hidden group block hover:-translate-y-1 hover:shadow-[0_14px_40px_rgb(60,30,80,0.12)] transition-all">
      <div className="relative aspect-4/3 overflow-hidden">
        <Media src={recipe.image?.url} alt={recipe.title} emoji="🥗" seed={recipe._id}
          className="group-hover:scale-105 transition-transform duration-500" />
        <FavoriteButton type="recipe" id={recipe._id} className="absolute top-3 right-3" />
      </div>
      <div className="p-5">
        {recipe.category?.name && <p className="text-xs font-semibold text-lavender-500 uppercase tracking-wide">{recipe.category.name}</p>}
        <h3 className="font-bold text-lg mt-1 line-clamp-1">{recipe.title}</h3>
        <p className="text-sm text-ink-600 mt-1 line-clamp-2">{recipe.description}</p>
        <div className="flex items-center gap-4 text-xs text-ink-400 mt-3">
          <span className="inline-flex items-center gap-1"><Icon name="clock" className="w-4 h-4" />{recipe.prepTimeMinutes} min</span>
          <span className="inline-flex items-center gap-1"><Icon name="users" className="w-4 h-4" />{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
        </div>
        {recipe.dietTags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.dietTags.slice(0, 3).map((t) => <span key={t} className="chip">{humanize(t)}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}

export function WorkoutCard({ workout }) {
  return (
    <Link to={`/workouts/${workout._id}`} data-anim
      className="card overflow-hidden group block hover:-translate-y-1 hover:shadow-[0_14px_40px_rgb(60,30,80,0.12)] transition-all">
      <div className="relative aspect-4/3 overflow-hidden">
        <Media src={workout.image?.url} alt={workout.title} emoji="🧘‍♀️" seed={workout._id}
          className="group-hover:scale-105 transition-transform duration-500" />
        <FavoriteButton type="workout" id={workout._id} className="absolute top-3 right-3" />
      </div>
      <div className="p-5">
        {workout.category?.name && <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide">{workout.category.name}</p>}
        <h3 className="font-bold text-lg mt-1 line-clamp-1">{workout.title}</h3>
        <p className="text-sm text-ink-600 mt-1 line-clamp-2">{workout.description}</p>
        <div className="flex items-center gap-4 text-xs text-ink-400 mt-3">
          <span className="inline-flex items-center gap-1"><Icon name="clock" className="w-4 h-4" />{workout.durationMinutes} min</span>
          <span className="inline-flex items-center gap-1"><Icon name="flame" className="w-4 h-4" />{humanize(workout.intensity)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="chip">{humanize(workout.difficulty)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProgramCard({ program }) {
  return (
    <Link to={`/programs/${program._id}`} data-anim
      className="card overflow-hidden group block hover:-translate-y-1 hover:shadow-[0_14px_40px_rgb(60,30,80,0.12)] transition-all">
      <div className="relative aspect-16/9 overflow-hidden">
        <Media src={program.image?.url} alt={program.title} emoji="📅" seed={program._id}
          className="group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-3 left-3 bg-white/95 text-rose-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {program.durationDays} days
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg line-clamp-1">{program.title}</h3>
        <p className="text-sm text-lavender-500 font-semibold mt-1 line-clamp-1">{program.goal}</p>
        <p className="text-sm text-ink-600 mt-2 line-clamp-2">{program.description}</p>
      </div>
    </Link>
  );
}

export function CardGrid({ children }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
