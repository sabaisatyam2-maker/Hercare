import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { workoutApi } from '../api/services';
import { humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { Media } from '../components/Media';
import { FavoriteButton } from '../components/FavoriteButton';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { Loading, ErrorState } from '../components/States';

// Only ever link out to http(s) URLs.
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);

export default function WorkoutDetail() {
  const { id } = useParams();
  const ref = useRef(null);
  const { data, loading, error, reload } = useApi((s) => workoutApi.get(id, s), [id]);
  const workout = data?.workout;

  useStagger(ref, [workout?._id]);

  if (loading) return <Container><Loading /></Container>;
  if (error || !workout) return <Container><ErrorState message={error || 'Workout not found.'} onRetry={reload} /></Container>;

  const video = safeUrl(workout.videoUrl);

  return (
    <Container>
      <div ref={ref} className="max-w-5xl mx-auto">
        <Link to="/workouts" className="text-sm font-semibold text-ink-400 hover:text-rose-500">&larr; All workouts</Link>

        <div data-anim className="card overflow-hidden mt-4 grid md:grid-cols-2">
          <div className="relative min-h-64 md:min-h-96">
            <div className="absolute inset-0"><Media src={workout.image?.url} alt={workout.title} emoji="🧘‍♀️" seed={workout._id} /></div>
          </div>
          <div className="p-6 sm:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                {workout.category?.name && <p className="text-xs font-bold uppercase tracking-wide text-rose-500">{workout.category.name}</p>}
                <h1 className="text-3xl font-extrabold tracking-tight mt-1">{workout.title}</h1>
              </div>
              <FavoriteButton type="workout" id={workout._id} className="!bg-rose-50 shrink-0" />
            </div>
            <p className="text-ink-600 mt-4 leading-relaxed">{workout.description}</p>
            <div className="flex flex-wrap gap-5 mt-6 text-sm text-ink-600">
              <span className="inline-flex items-center gap-2"><Icon name="clock" /> {workout.durationMinutes} min</span>
              <span className="inline-flex items-center gap-2"><Icon name="flame" /> {humanize(workout.intensity)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-5"><span className="chip">{humanize(workout.difficulty)}</span></div>
            {video && (
              <div className="mt-6">
                <a href={video} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold bg-lavender-100 text-lavender-600 hover:bg-lavender-200 transition-all">
                  ▶ Watch demo video
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mt-6">
          <section data-anim className="card p-6 md:col-span-2 h-fit">
            <h2 className="text-xl font-bold mb-4">What you need</h2>
            {workout.equipmentNeeded?.length > 0 ? (
              <ul className="space-y-2 text-sm text-ink-600">
                {workout.equipmentNeeded.map((e, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">•</span>{e}</li>)}
              </ul>
            ) : <p className="text-sm text-ink-600">No equipment needed. 🙌</p>}
          </section>

          <section data-anim className="card p-6 md:col-span-3">
            <h2 className="text-xl font-bold mb-4">Steps</h2>
            <ol className="space-y-5">
              {workout.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-lavender-100 text-lavender-600 font-bold text-sm grid place-items-center">{i + 1}</span>
                  <p className="text-sm text-ink-600 leading-relaxed pt-1">{s}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <p className="text-xs text-ink-400 mt-6 text-center">Listen to your body and stop if something hurts. Talk to your doctor before starting a new exercise routine.</p>
        <div className="text-center mt-4"><Button to="/workouts" variant="ghost" size="sm">Browse more workouts</Button></div>
      </div>
    </Container>
  );
}
