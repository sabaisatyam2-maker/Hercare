import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { enrollmentApi, logApi, recipeApi } from '../api/services';
import { MOODS } from '../utils/constants';
import { addDays, prettyDate, toLocalISODate } from '../utils/format';
import { Container } from '../components/Layouts';
import { ProgressBar } from '../components/Media';
import { Button } from '../components/Button';
import { RecipeCard, CardGrid } from '../components/Cards';
import { Loading } from '../components/States';

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function Stat({ emoji, label, value, sub }) {
  return (
    <div data-anim className="card p-5">
      <p className="text-2xl">{emoji}</p>
      <p className="text-2xl font-extrabold mt-2">{value}</p>
      <p className="text-sm font-semibold text-ink-600">{label}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const ref = useRef(null);
  const today = toLocalISODate();

  const logs = useApi((s) => logApi.range(addDays(today, -6), today, s), [today]);
  const active = useApi((s) => enrollmentApi.list('active', s), []);
  const recipes = useApi((s) => recipeApi.list(user?.dietPreference && user.dietPreference !== 'no-preference' ? { dietTag: user.dietPreference } : undefined, s), [user?.dietPreference]);

  const week = logs.data?.logs || [];
  const byDate = useMemo(() => Object.fromEntries(week.map((l) => [l.date.slice(0, 10), l])), [week]);
  const todayLog = byDate[today];

  const stats = useMemo(() => ({
    mood: avg(week.filter((l) => l.mood).map((l) => l.mood)),
    sleep: avg(week.filter((l) => l.sleepHours != null).map((l) => l.sleepHours)),
    water: avg(week.filter((l) => l.hydrationLiters != null).map((l) => l.hydrationLiters)),
  }), [week]);

  const loaded = !logs.loading && !active.loading;
  useStagger(ref, [loaded]);

  const enrollments = active.data?.enrollments || [];
  const suggestions = (recipes.data?.recipes || []).slice(0, 4);

  if (!loaded) return <Container><Loading label="Getting your day ready..." /></Container>;

  return (
    <Container>
      <div ref={ref}>
        <div data-anim className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 🌸
          </h1>
          {user?.goals?.length > 0 && (
            <p className="text-ink-600 mt-2">Your focus: {user.goals.slice(0, 3).join(' · ')}</p>
          )}
        </div>

        {/* Today */}
        <div data-anim className="card p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-rose-50 to-lavender-50">
          {todayLog ? (
            <div>
              <p className="font-bold text-lg">You've checked in today {todayLog.mood ? MOODS[todayLog.mood - 1] : '✓'}</p>
              <p className="text-sm text-ink-600 mt-1">Need to add something? You can update today's log anytime.</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-lg">How are you feeling today?</p>
              <p className="text-sm text-ink-600 mt-1">A one-minute check-in helps you spot patterns.</p>
            </div>
          )}
          <Button to="/daily-log">{todayLog ? 'Update today' : 'Log today'}</Button>
        </div>

        {/* Week stats */}
        <h2 data-anim className="text-xl font-bold mb-3">Your last 7 days</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Stat emoji="🙂" label="Avg mood" value={stats.mood ? `${stats.mood.toFixed(1)} / 5` : '-'} sub={`${week.length} day${week.length === 1 ? '' : 's'} logged`} />
          <Stat emoji="😴" label="Avg sleep" value={stats.sleep != null ? `${stats.sleep.toFixed(1)} h` : '-'} sub={user?.sleepGoalHours ? `Goal ${user.sleepGoalHours} h` : undefined} />
          <Stat emoji="💧" label="Avg water" value={stats.water != null ? `${stats.water.toFixed(1)} L` : '-'} sub={user?.waterGoalLiters ? `Goal ${user.waterGoalLiters} L` : undefined} />
          <Stat emoji="🔥" label="Streak" value={(() => {
            let s = 0; let d = byDate[today] ? today : addDays(today, -1);
            while (byDate[d]) { s++; d = addDays(d, -1); }
            return `${s} day${s === 1 ? '' : 's'}`;
          })()} sub="Days in a row" />
        </div>

        {/* Mood bars */}
        <div data-anim className="card p-6 mb-8">
          <p className="font-semibold mb-4">Mood this week</p>
          <div className="flex items-end gap-3 h-28">
            {Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i)).map((d) => {
              const l = byDate[d];
              return (
                <div key={d} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <div title={l?.mood ? `Mood ${l.mood}/5` : 'No log'}
                    className={`w-full rounded-t-lg transition-all ${l?.mood ? 'bg-linear-to-t from-rose-300 to-lavender-300' : 'bg-ink-100'}`}
                    style={{ height: `${l?.mood ? (l.mood / 5) * 100 : 8}%` }} />
                  <span className="text-[10px] text-ink-400">{prettyDate(d).split(',')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Programs */}
        <div data-anim className="flex items-end justify-between mb-3">
          <h2 className="text-xl font-bold">Your programs</h2>
          <Link to="/my-programs" className="text-sm font-semibold text-rose-500 hover:underline">View all</Link>
        </div>
        {enrollments.length === 0 ? (
          <div data-anim className="card p-6 mb-8 text-center">
            <p className="text-ink-600 mb-4">You're not following a program yet. Pick one that fits your goals.</p>
            <Button to="/programs" variant="secondary">Browse programs</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            {enrollments.map((e) => (
              <Link key={e._id} to={`/my-programs/${e._id}`} data-anim className="card p-5 hover:-translate-y-1 transition-transform block">
                <p className="font-bold">{e.program?.title}</p>
                <p className="text-sm text-ink-600 mt-1">Day {e.currentDay} of {e.program?.durationDays}</p>
                <ProgressBar value={e.progressPercent} className="mt-3" />
                <p className="text-xs text-ink-400 mt-2">{e.progressPercent}% complete</p>
              </Link>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <div data-anim className="flex items-end justify-between mb-3">
              <h2 className="text-xl font-bold">Recipes for you</h2>
              <Link to="/recipes" className="text-sm font-semibold text-rose-500 hover:underline">See all</Link>
            </div>
            <CardGrid>{suggestions.map((r) => <RecipeCard key={r._id} recipe={r} />)}</CardGrid>
          </>
        )}
      </div>
    </Container>
  );
}
