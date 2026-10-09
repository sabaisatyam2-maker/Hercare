import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { enrollmentApi, programApi } from '../api/services';
import { getErrorMessage, humanize } from '../utils/format';
import { Container } from '../components/Layouts';
import { Media } from '../components/Media';
import { Button } from '../components/Button';
import { Loading, ErrorState } from '../components/States';

export default function ProgramDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef(null);
  const [enrolling, setEnrolling] = useState(false);
  const [open, setOpen] = useState(1);

  const { data, loading, error, reload } = useApi((s) => programApi.get(id, s), [id]);
  const program = data?.program;
  const canEnroll = !!user && !isAdmin;

  // Is the user already in this program?
  const mine = useApi((s) => enrollmentApi.list('active', s), [id, user?._id], { enabled: canEnroll });
  const activeEnrollment = (mine.data?.enrollments || []).find((e) => e.program?._id === id);

  useStagger(ref, [program?._id]);

  const enroll = async () => {
    if (!user) {
      toast.info('Log in to start this program.');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!user.onboardingCompleted) { navigate('/onboarding'); return; }
    setEnrolling(true);
    try {
      const res = await enrollmentApi.enroll(id);
      toast.success('You are enrolled. Day 1 starts now!');
      navigate(`/my-programs/${res.enrollment._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      if (err.response?.status === 409) mine.reload();
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Container><Loading /></Container>;
  if (error || !program) return <Container><ErrorState message={error || 'Program not found.'} onRetry={reload} /></Container>;

  return (
    <Container>
      <div ref={ref} className="max-w-4xl mx-auto">
        <Link to="/programs" className="text-sm font-semibold text-ink-400 hover:text-rose-500">&larr; All programs</Link>

        <div data-anim className="card overflow-hidden mt-4">
          <div className="aspect-21/9 relative">
            <Media src={program.image?.url} alt={program.title} emoji="📅" seed={program._id} />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="chip !bg-rose-50 !text-rose-600 !border-rose-100">{program.durationDays} days</span>
              <span className="chip">{program.goal}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{program.title}</h1>
            <p className="text-ink-600 mt-3 leading-relaxed">{program.description}</p>
            <div className="mt-6">
              {isAdmin ? (
                <p className="text-sm text-ink-400">You are viewing this as an admin.</p>
              ) : activeEnrollment ? (
                <Button to={`/my-programs/${activeEnrollment._id}`} size="lg">Continue your program</Button>
              ) : (
                <Button size="lg" onClick={enroll} loading={enrolling}>Start this program</Button>
              )}
            </div>
          </div>
        </div>

        <h2 data-anim className="text-2xl font-bold mt-10 mb-4">Day by day</h2>
        <div className="space-y-3">
          {program.days.map((day) => {
            const isOpen = open === day.dayNumber;
            return (
              <div key={day.dayNumber} data-anim className="card overflow-hidden">
                <button className="w-full flex items-center gap-4 p-4 text-left" aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : day.dayNumber)}>
                  <span className="w-10 h-10 rounded-full bg-linear-to-br from-rose-400 to-lavender-400 text-white font-bold grid place-items-center shrink-0">{day.dayNumber}</span>
                  <span className="font-semibold flex-1">{day.title}</span>
                  <span className="text-ink-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-ink-100 text-sm space-y-4">
                    {day.recipes?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-lavender-500 mb-2">Recipes</p>
                        <ul className="space-y-1.5">
                          {day.recipes.map((r) => (
                            <li key={r._id}><Link to={`/recipes/${r._id}`} className="text-ink-900 hover:text-rose-500 font-medium">🥗 {r.title}</Link>
                              {r.prepTimeMinutes && <span className="text-ink-400"> · {r.prepTimeMinutes} min</span>}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {day.workouts?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-rose-500 mb-2">Workouts</p>
                        <ul className="space-y-1.5">
                          {day.workouts.map((w) => (
                            <li key={w._id}><Link to={`/workouts/${w._id}`} className="text-ink-900 hover:text-rose-500 font-medium">🧘‍♀️ {w.title}</Link>
                              <span className="text-ink-400"> · {w.durationMinutes} min · {humanize(w.difficulty)}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {day.tasks?.length > 0 && (
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-ink-400 mb-2">Daily habits</p>
                        <ul className="space-y-1.5 text-ink-600">
                          {day.tasks.map((t, i) => <li key={i}>✓ {t}</li>)}
                        </ul>
                      </div>
                    )}
                    {!day.recipes?.length && !day.workouts?.length && !day.tasks?.length && (
                      <p className="text-ink-400">A rest day. Take it easy. 🌿</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
