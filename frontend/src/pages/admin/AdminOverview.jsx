import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { categoryApi, programApi, recipeApi, workoutApi } from '../../api/services';
import { Loading, ErrorState } from '../../components/States';

const count = (fn) => async (signal) => {
  const [all, drafts] = await Promise.all([
    fn({ limit: 1 }, signal),
    fn({ limit: 1, isPublished: 'false' }, signal),
  ]);
  return { total: all.total, drafts: drafts.total };
};

export default function AdminOverview() {
  const stats = useApi(async (signal) => {
    const [recipes, workouts, programs, cats] = await Promise.all([
      count(recipeApi.adminList)(signal),
      count(workoutApi.adminList)(signal),
      count(programApi.adminList)(signal),
      categoryApi.list(undefined, signal),
    ]);
    return { recipes, workouts, programs, categories: Array.isArray(cats) ? cats.length : 0 };
  }, []);

  if (stats.loading) return <Loading />;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data;

  const cards = [
    { to: '/admin/recipes', emoji: '🥗', label: 'Recipes', value: s.recipes.total, sub: `${s.recipes.drafts} draft${s.recipes.drafts === 1 ? '' : 's'}` },
    { to: '/admin/workouts', emoji: '🧘‍♀️', label: 'Workouts', value: s.workouts.total, sub: `${s.workouts.drafts} draft${s.workouts.drafts === 1 ? '' : 's'}` },
    { to: '/admin/programs', emoji: '📅', label: 'Programs', value: s.programs.total, sub: `${s.programs.drafts} draft${s.programs.drafts === 1 ? '' : 's'}` },
    { to: '/admin/categories', emoji: '🏷️', label: 'Categories', value: s.categories, sub: 'recipe and workout' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Overview</h1>
      <p className="text-ink-600 mt-1 mb-8">Manage everything members see on HerCare.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card p-6 hover:-translate-y-1 transition-transform block">
            <p className="text-3xl">{c.emoji}</p>
            <p className="text-3xl font-extrabold mt-3">{c.value}</p>
            <p className="font-semibold text-ink-600">{c.label}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.sub}</p>
          </Link>
        ))}
      </div>
      <div className="card p-6 mt-8">
        <h2 className="font-bold mb-2">Quick tips</h2>
        <ul className="text-sm text-ink-600 space-y-1.5 list-disc pl-5">
          <li>Create categories first, then add recipes and workouts to them.</li>
          <li>Drafts are only visible to admins. Publish when you're ready.</li>
          <li>A recipe or workout used in a program cannot be deleted until it is removed from that program.</li>
          <li>Programs with enrolled members can't be deleted. Unpublish them instead.</li>
        </ul>
      </div>
    </div>
  );
}
