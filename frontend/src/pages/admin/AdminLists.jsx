import AdminResourceList from './AdminResourceList';
import { recipeApi, workoutApi, programApi } from '../../api/services';
import { humanize } from '../../utils/format';

export function AdminRecipes() {
  return (
    <AdminResourceList title="Recipes" noun="Recipe" basePath="/admin/recipes" itemsKey="recipes" emoji="🥗"
      listFn={recipeApi.adminList} removeFn={recipeApi.remove}
      meta={(r) => `${r.category?.name || 'No category'} · ${r.prepTimeMinutes} min`} />
  );
}

export function AdminWorkouts() {
  return (
    <AdminResourceList title="Workouts" noun="Workout" basePath="/admin/workouts" itemsKey="workouts" emoji="🧘‍♀️"
      listFn={workoutApi.adminList} removeFn={workoutApi.remove}
      meta={(w) => `${w.category?.name || 'No category'} · ${w.durationMinutes} min · ${humanize(w.difficulty)}`} />
  );
}

export function AdminPrograms() {
  return (
    <AdminResourceList title="Programs" noun="Program" basePath="/admin/programs" itemsKey="programs" emoji="📅"
      listFn={programApi.adminList} removeFn={programApi.remove}
      meta={(p) => `${p.durationDays} days · ${p.goal}`} />
  );
}
