import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { useToast } from '../context/ToastContext';
import { enrollmentApi } from '../api/services';
import { getErrorMessage, humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { ProgressBar } from '../components/Media';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState, Loading } from '../components/States';

// Tick-offs for the little daily habits are kept on this device only.
const taskKey = (enrollmentId, day) => `hercare:tasks:${enrollmentId}:${day}`;
const readTasks = (id, day) => {
  try { return JSON.parse(localStorage.getItem(taskKey(id, day)) || '{}'); } catch { return {}; }
};
const writeTasks = (id, day, val) => {
  try { localStorage.setItem(taskKey(id, day), JSON.stringify(val)); } catch { /* storage unavailable */ }
};

export default function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const ref = useRef(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [ticks, setTicks] = useState({});

  const { data, loading, error, reload } = useApi((s) => enrollmentApi.get(id, s), [id]);
  const enrollment = data?.enrollment;
  const program = enrollment?.program;
  const days = program?.days || [];

  const active = enrollment?.status === 'active';
  const shownDay = selected ?? enrollment?.currentDay ?? 1;
  const day = days.find((d) => d.dayNumber === shownDay);

  useEffect(() => { setTicks(readTasks(id, shownDay)); }, [id, shownDay]);
  useStagger(ref, [enrollment?._id]);

  const toggleTask = (i) => {
    const next = { ...ticks, [i]: !ticks[i] };
    setTicks(next);
    writeTasks(id, shownDay, next);
  };

  const complete = async () => {
    setBusy(true);
    try {
      const res = await enrollmentApi.completeDay(id, shownDay);
      toast.success(res.message);
      setSelected(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      await enrollmentApi.abandon(id);
      toast.info('Program stopped. You can start it again any time.');
      navigate('/my-programs');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
      setConfirmStop(false);
    }
  };

  if (loading && !data) return <Container><Loading /></Container>;
  if (error || !enrollment) return <Container><ErrorState message={error || 'Enrollment not found.'} onRetry={reload} /></Container>;

  const statusOf = (n) => (enrollment.completedDays.includes(n) ? 'done' : active && n === enrollment.currentDay ? 'current' : active && n > enrollment.currentDay ? 'locked' : 'open');
  const isCurrent = active && shownDay === enrollment.currentDay;

  return (
    <Container>
      <div ref={ref} className="max-w-4xl mx-auto">
        <Link to="/my-programs" className="text-sm font-semibold text-ink-400 hover:text-rose-500">&larr; My programs</Link>

        <div data-anim className="card p-6 sm:p-8 mt-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-lavender-500">
                {enrollment.status === 'completed' ? 'Completed 🎉' : enrollment.status === 'abandoned' ? 'Stopped' : `Day ${enrollment.currentDay} of ${program.durationDays}`}
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">{program.title}</h1>
              <p className="text-ink-600 mt-2">{program.goal}</p>
            </div>
            <Button variant="outline" size="sm" to={`/programs/${program._id}`}>View program</Button>
          </div>
          <ProgressBar value={data.progressPercent} className="mt-5" />
          <p className="text-xs text-ink-400 mt-2">{enrollment.completedDays.length} of {program.durationDays} days done · {data.progressPercent}%</p>
        </div>

        {/* Day picker */}
        <div data-anim className="card p-4 mt-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              const st = statusOf(d.dayNumber);
              return (
                <button key={d.dayNumber} onClick={() => setSelected(d.dayNumber)} aria-pressed={shownDay === d.dayNumber}
                  className={`shrink-0 w-11 h-11 rounded-full font-bold text-sm border-2 transition-all
                    ${shownDay === d.dayNumber ? 'ring-4 ring-rose-100' : ''}
                    ${st === 'done' ? 'bg-green-100 border-green-300 text-green-700' : st === 'current' ? 'bg-rose-500 border-rose-500 text-white' : st === 'locked' ? 'bg-white border-ink-100 text-ink-400' : 'bg-white border-ink-200 text-ink-600'}`}>
                  {st === 'done' ? '✓' : d.dayNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day content */}
        {day && (
          <div data-anim className="card p-6 sm:p-8 mt-5">
            <h2 className="text-xl font-bold">{day.title}</h2>
            <div className="mt-5 space-y-6">
              {day.recipes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-lavender-500 mb-2">Eat</p>
                  <ul className="space-y-2">
                    {day.recipes.map((r) => (
                      <li key={r._id}>
                        <Link to={`/recipes/${r._id}`} className="block p-3 rounded-xl border border-ink-100 hover:border-lavender-200 hover:bg-lavender-50/50 transition-all">
                          <span className="font-semibold">🥗 {r.title}</span>
                          {r.prepTimeMinutes && <span className="text-sm text-ink-400"> · {r.prepTimeMinutes} min</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {day.workouts?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-500 mb-2">Move</p>
                  <ul className="space-y-2">
                    {day.workouts.map((w) => (
                      <li key={w._id}>
                        <Link to={`/workouts/${w._id}`} className="block p-3 rounded-xl border border-ink-100 hover:border-rose-200 hover:bg-rose-50/50 transition-all">
                          <span className="font-semibold">🧘‍♀️ {w.title}</span>
                          <span className="text-sm text-ink-400"> · {w.durationMinutes} min · {humanize(w.difficulty)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {day.tasks?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400 mb-2">Daily habits</p>
                  <ul className="space-y-2">
                    {day.tasks.map((t, i) => (
                      <li key={i}>
                        <label className="flex items-center gap-3 cursor-pointer text-sm">
                          <input type="checkbox" className="accent-rose-500 w-4 h-4" checked={!!ticks[i]} onChange={() => toggleTask(i)} />
                          <span className={ticks[i] ? 'line-through text-ink-400' : ''}>{t}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!day.recipes?.length && !day.workouts?.length && !day.tasks?.length && (
                <p className="text-ink-600">A rest day. Be kind to yourself. 🌿</p>
              )}
            </div>

            {isCurrent && (
              <div className="mt-8"><Button size="lg" onClick={complete} loading={busy}>Mark day {shownDay} complete</Button></div>
            )}
            {active && !isCurrent && shownDay > enrollment.currentDay && (
              <p className="mt-6 text-sm text-ink-400">Finish day {enrollment.currentDay} first to unlock this day.</p>
            )}
            {enrollment.completedDays.includes(shownDay) && <p className="mt-6 text-sm text-green-700 font-semibold">✓ You completed this day.</p>}
          </div>
        )}

        {active && (
          <div className="text-center mt-8">
            <button onClick={() => setConfirmStop(true)} className="text-sm text-ink-400 hover:text-rose-500 underline">Stop this program</button>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmStop} title="Stop this program?" danger confirmLabel="Stop program" loading={busy}
        message="Your progress will be saved in 'Stopped' programs, and you can start again whenever you like."
        onConfirm={stop} onCancel={() => setConfirmStop(false)} />
    </Container>
  );
}
