import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/services';
import { ACTIVITY_LEVELS, DIET_PREFS, GOAL_OPTIONS } from '../utils/constants';
import { getErrorMessage } from '../utils/format';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { ProgressBar } from '../components/Media';
import { FormField } from '../components/FormField';

const STEPS = ['Your goals', 'Activity', 'Food', 'Your routine'];

function OptionCard({ selected, onClick, emoji, title, hint }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`text-left p-4 rounded-2xl border-2 transition-all w-full
        ${selected ? 'border-rose-400 bg-rose-50 shadow-sm' : 'border-ink-100 bg-white hover:border-lavender-200'}`}>
      <div className="flex items-center gap-3">
        {emoji && <span className="text-2xl">{emoji}</span>}
        <div>
          <p className="font-semibold">{title}</p>
          {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
        </div>
        {selected && <span className="ml-auto text-rose-500 font-bold">✓</span>}
      </div>
    </button>
  );
}

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState(user?.goals || []);
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || '');
  const [dietPreference, setDietPreference] = useState(user?.dietPreference || '');
  const [cycleLength, setCycleLength] = useState(user?.cycleLength ?? 28);
  const [sleepGoalHours, setSleepGoalHours] = useState(user?.sleepGoalHours ?? 8);
  const [waterGoalLiters, setWaterGoalLiters] = useState(user?.waterGoalLiters ?? 2.5);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Slide the panel in on each step change.
  useEffect(() => {
    if (!panelRef.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const tween = gsap.fromTo(panelRef.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
    return () => tween.kill();
  }, [step]);

  const toggleGoal = (g) => {
    setError('');
    setGoals((cur) => {
      if (cur.includes(g)) return cur.filter((x) => x !== g);
      if (cur.length >= 10) return cur;
      return [...cur, g];
    });
  };

  const validateStep = () => {
    if (step === 0 && goals.length === 0) return 'Pick at least one goal to personalise your plan.';
    if (step === 1 && !activityLevel) return 'Please choose your activity level.';
    if (step === 2 && !dietPreference) return 'Please choose a food preference.';
    if (step === 3) {
      const c = Number(cycleLength), s = Number(sleepGoalHours), w = Number(waterGoalLiters);
      if (!Number.isInteger(c) || c < 15 || c > 90) return 'Cycle length must be a whole number between 15 and 90 days.';
      if (!(s >= 4 && s <= 12)) return 'Sleep goal must be between 4 and 12 hours.';
      if (!(w >= 0.5 && w <= 10)) return 'Water goal must be between 0.5 and 10 litres.';
    }
    return '';
  };

  const next = () => {
    const msg = validateStep();
    if (msg) { setError(msg); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const submit = async () => {
    const msg = validateStep();
    if (msg) { setError(msg); return; }
    setSaving(true); setError('');
    try {
      const { user: updated } = await userApi.onboarding({
        goals, activityLevel, dietPreference,
        cycleLength: Number(cycleLength),
        sleepGoalHours: Number(sleepGoalHours),
        waterGoalLiters: Number(waterGoalLiters),
      });
      updateUser({ ...updated, onboardingCompleted: true });
      toast.success('All set! Your dashboard is ready.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const last = step === STEPS.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">🌸</p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {user?.onboardingCompleted ? 'Update your preferences' : `Welcome, ${user?.name?.split(' ')[0] || 'friend'}!`}
        </h1>
        <p className="text-ink-600 mt-2">A few quick questions so HerCare fits you.</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-ink-400 mb-2">
          <span>Step {step + 1} of {STEPS.length}</span><span>{STEPS[step]}</span>
        </div>
        <ProgressBar value={((step + 1) / STEPS.length) * 100} />
      </div>

      <div className="card p-6 sm:p-8">
        <Alert type="error">{error}</Alert>
        <div ref={panelRef}>
          {step === 0 && (
            <>
              <h2 className="text-xl font-bold mb-1">What would you like to focus on?</h2>
              <p className="text-sm text-ink-600 mb-5">Choose up to 10 ({goals.length} selected).</p>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((g) => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)} aria-pressed={goals.includes(g)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all
                      ${goals.includes(g) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-ink-100 text-ink-600 hover:border-rose-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold mb-5">How active are you right now?</h2>
              <div className="grid gap-3">
                {ACTIVITY_LEVELS.map((a) => (
                  <OptionCard key={a.value} selected={activityLevel === a.value} onClick={() => { setActivityLevel(a.value); setError(''); }}
                    emoji={a.emoji} title={a.label} hint={a.hint} />
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold mb-5">How do you like to eat?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {DIET_PREFS.map((d) => (
                  <OptionCard key={d.value} selected={dietPreference === d.value} onClick={() => { setDietPreference(d.value); setError(''); }}
                    emoji={d.emoji} title={d.label} />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold mb-5">Your daily routine</h2>
              <FormField label="Typical cycle length (days)" name="cycleLength" type="number" min="15" max="90" step="1"
                value={cycleLength} onChange={(e) => setCycleLength(e.target.value)}
                hint="With irregular cycles, enter your usual average." />
              <FormField label="Sleep goal (hours per night)" name="sleepGoalHours" type="number" min="4" max="12" step="0.5"
                value={sleepGoalHours} onChange={(e) => setSleepGoalHours(e.target.value)} />
              <FormField label="Water goal (litres per day)" name="waterGoalLiters" type="number" min="0.5" max="10" step="0.25"
                value={waterGoalLiters} onChange={(e) => setWaterGoalLiters(e.target.value)} />
            </>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-8">
          <Button variant="ghost" onClick={() => { setError(''); setStep((s) => s - 1); }} disabled={step === 0}>Back</Button>
          {last
            ? <Button onClick={submit} loading={saving}>Finish</Button>
            : <Button onClick={next}>Continue</Button>}
        </div>
      </div>
    </div>
  );
}
