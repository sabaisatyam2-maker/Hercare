import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useStagger } from '../hooks/useReveal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logApi } from '../api/services';
import { MOODS } from '../utils/constants';
import { addDays, getErrorMessage, prettyDate, toLocalISODate } from '../utils/format';
import { Container } from '../components/Layouts';
import { PageHeader } from '../components/Media';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { TextArea } from '../components/FormField';
import { Loading } from '../components/States';

const EMPTY = { mood: '', energy: '', stressLevel: '', sleepHours: '', hydrationLiters: '', cycleDay: '', notes: '' };
const fromLog = (log) => ({
  mood: log.mood ?? '', energy: log.energy ?? '', stressLevel: log.stressLevel ?? '',
  sleepHours: log.sleepHours ?? '', hydrationLiters: log.hydrationLiters ?? '',
  cycleDay: log.cycleDay ?? '', notes: log.notes ?? '',
});

function Scale({ label, value, onChange, low, high, emojis }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-ink-400">{low} → {high}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(value === n ? '' : n)} aria-pressed={value === n}
            aria-label={`${label} ${n} of 5`}
            className={`flex-1 h-12 rounded-xl border-2 text-lg font-bold transition-all
              ${value === n ? 'border-rose-400 bg-rose-50 text-rose-600 scale-105' : 'border-ink-100 bg-white text-ink-400 hover:border-lavender-200'}`}>
            {emojis ? emojis[n - 1] : n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DailyLog() {
  const { user } = useAuth();
  const toast = useToast();
  const ref = useRef(null);
  const today = toLocalISODate();

  const [date, setDate] = useState(today);
  const [form, setForm] = useState(EMPTY);
  const [exists, setExists] = useState(false);
  const [loadingDay, setLoadingDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Last 14 days history (strip + trend)
  const history = useApi((s) => logApi.range(addDays(today, -13), today, s), [today]);
  const logsByDate = useMemo(() => {
    const m = {};
    (history.data?.logs || []).forEach((l) => { m[l.date.slice(0, 10)] = l; });
    return m;
  }, [history.data]);

  // Load the selected day
  useEffect(() => {
    let cancelled = false;
    setLoadingDay(true); setError('');
    logApi.get(date)
      .then(({ log }) => { if (!cancelled) { setForm(fromLog(log)); setExists(true); } })
      .catch((err) => {
        if (cancelled) return;
        setForm(EMPTY); setExists(false);
        if (err.response?.status !== 404) setError(getErrorMessage(err));
      })
      .finally(() => { if (!cancelled) setLoadingDay(false); });
    return () => { cancelled = true; };
  }, [date]);

  useStagger(ref, []);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const onNum = (key) => (e) => set(key)(e.target.value);

  const buildPayload = () => {
    const out = {};
    ['mood', 'energy', 'stressLevel', 'cycleDay'].forEach((k) => { if (form[k] !== '') out[k] = Number(form[k]); });
    ['sleepHours', 'hydrationLiters'].forEach((k) => { if (form[k] !== '') out[k] = Number(form[k]); });
    if (exists) out.notes = form.notes.trim(); // on update, empty clears notes
    else if (form.notes.trim()) out.notes = form.notes.trim();
    return out;
  };

  const validate = () => {
    const n = (v) => (v === '' ? null : Number(v));
    const sleep = n(form.sleepHours), water = n(form.hydrationLiters), cd = n(form.cycleDay);
    if (sleep !== null && !(sleep >= 0 && sleep <= 24)) return 'Sleep must be between 0 and 24 hours.';
    if (water !== null && !(water >= 0 && water <= 20)) return 'Water must be between 0 and 20 litres.';
    if (cd !== null && !(Number.isInteger(cd) && cd >= 1 && cd <= 90)) return 'Cycle day must be a whole number between 1 and 90.';
    if (form.notes.length > 1000) return 'Notes can be at most 1000 characters.';
    return '';
  };

  const onSave = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    const payload = buildPayload();
    if (!exists && Object.keys(payload).length === 0) { setError('Add at least one detail before saving.'); return; }
    setSaving(true); setError('');
    try {
      const res = exists ? await logApi.update(date, payload) : await logApi.create({ date, ...payload });
      setForm(fromLog(res.log)); setExists(true);
      toast.success(exists ? 'Log updated.' : 'Saved! Nice work checking in.');
      history.reload();
    } catch (err) {
      setError(getErrorMessage(err));
      if (err.response?.status === 409) setExists(true);
    } finally {
      setSaving(false);
    }
  };

  const waterGoal = user?.waterGoalLiters;
  const sleepGoal = user?.sleepGoalHours;
  const water = Number(form.hydrationLiters) || 0;

  return (
    <Container>
      <div ref={ref} className="max-w-4xl mx-auto">
        <PageHeader title="Daily log" subtitle="A minute a day to understand how you feel." />

        {/* Day strip */}
        <div data-anim className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <p className="font-semibold">{date === today ? 'Today' : prettyDate(date)}</p>
            <input type="date" className="input !w-auto" value={date} max={today} aria-label="Choose a date"
              onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 14 }, (_, i) => addDays(today, -13 + i)).map((d) => {
              const l = logsByDate[d];
              return (
                <button key={d} type="button" onClick={() => setDate(d)} aria-pressed={d === date}
                  className={`shrink-0 w-14 py-2 rounded-xl border-2 text-center transition-all
                    ${d === date ? 'border-rose-400 bg-rose-50' : 'border-ink-100 bg-white hover:border-lavender-200'}`}>
                  <p className="text-[10px] uppercase text-ink-400">{prettyDate(d).split(',')[0]}</p>
                  <p className="font-bold text-sm">{Number(d.slice(8))}</p>
                  <p className="text-sm h-5">{l?.mood ? MOODS[l.mood - 1] : <span className="text-ink-200">·</span>}</p>
                </button>
              );
            })}
          </div>
        </div>

        <form data-anim onSubmit={onSave} className="card p-6 sm:p-8" noValidate>
          {loadingDay ? <Loading label="Loading..." /> : (
            <>
              <Alert type="error">{error}</Alert>
              {exists && <Alert type="info">You already logged this day. Saving will update it.</Alert>}

              <Scale label="Mood" value={form.mood} onChange={set('mood')} low="low" high="great" emojis={MOODS} />
              <Scale label="Energy" value={form.energy} onChange={set('energy')} low="drained" high="energised" />
              <Scale label="Stress" value={form.stressLevel} onChange={set('stressLevel')} low="calm" high="very stressed" />

              <div className="grid sm:grid-cols-2 gap-5 mb-2">
                <div>
                  <label htmlFor="sleepHours" className="block text-sm font-semibold mb-1.5">😴 Sleep (hours)</label>
                  <input id="sleepHours" type="number" min="0" max="24" step="0.5" className="input"
                    value={form.sleepHours} onChange={onNum('sleepHours')} placeholder={sleepGoal ? `Goal: ${sleepGoal}` : '7.5'} />
                </div>
                <div>
                  <label htmlFor="cycleDay" className="block text-sm font-semibold mb-1.5">🌙 Cycle day</label>
                  <input id="cycleDay" type="number" min="1" max="90" step="1" className="input"
                    value={form.cycleDay} onChange={onNum('cycleDay')} placeholder="Optional" />
                </div>
              </div>

              <div className="mt-5 mb-4">
                <label htmlFor="hydrationLiters" className="block text-sm font-semibold mb-1.5">💧 Water (litres)</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <input id="hydrationLiters" type="number" min="0" max="20" step="0.25" className="input !w-32"
                    value={form.hydrationLiters} onChange={onNum('hydrationLiters')} placeholder={waterGoal ? `Goal: ${waterGoal}` : '2'} />
                  {[0.25, 0.5].map((a) => (
                    <button key={a} type="button"
                      onClick={() => set('hydrationLiters')(String(Math.min(20, Math.round((water + a) * 100) / 100)))}
                      className="px-3 py-2 rounded-xl bg-lavender-50 text-lavender-600 text-sm font-semibold hover:bg-lavender-100">
                      +{a}L
                    </button>
                  ))}
                </div>
                {waterGoal > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-lavender-300 to-lavender-500 transition-all"
                      style={{ width: `${Math.min(100, (water / waterGoal) * 100)}%` }} />
                  </div>
                )}
              </div>

              <TextArea label="Notes" name="notes" rows={3} maxLength={1000} placeholder="Symptoms, cravings, anything you want to remember..."
                value={form.notes} onChange={(e) => set('notes')(e.target.value)} />

              <Button type="submit" full loading={saving}>{exists ? 'Update log' : 'Save log'}</Button>
            </>
          )}
        </form>
      </div>
    </Container>
  );
}
