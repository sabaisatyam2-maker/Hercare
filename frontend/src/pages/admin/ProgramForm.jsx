import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { programApi, recipeApi, workoutApi, toFormData } from '../../api/services';
import { DURATIONS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/format';
import { FormField, SelectField, TextArea } from '../../components/FormField';
import { ImageUpload, ItemPicker, ListEditor, Toggle } from '../../components/AdminUI';
import { FormShell } from '../../components/FormShell';
import { ErrorState, Loading } from '../../components/States';

const blankDay = (n) => ({ dayNumber: n, title: `Day ${n}`, recipes: [], workouts: [], tasks: [] });
const resize = (days, count) =>
  Array.from({ length: count }, (_, i) => days[i] || blankDay(i + 1));
const ids = (list = []) => list.map((x) => (typeof x === 'string' ? x : x._id));

export default function ProgramForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useApi((s) => programApi.adminGet(id, s), [id], { enabled: editing });
  // Only published items can be added to a program (drafts are invisible to members).
  const recipes = useApi((s) => recipeApi.list(undefined, s), []);
  const workouts = useApi((s) => workoutApi.list(undefined, s), []);

  const [f, setF] = useState({ title: '', description: '', goal: '', durationDays: 7, isPublished: true });
  const [days, setDays] = useState(resize([], 7));
  const [openDay, setOpenDay] = useState(1);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = existing.data?.program;
    if (!p) return;
    setF({ title: p.title, description: p.description, goal: p.goal, durationDays: p.durationDays, isPublished: p.isPublished });
    setDays(p.days.map((d) => ({
      dayNumber: d.dayNumber, title: d.title,
      recipes: ids(d.recipes), workouts: ids(d.workouts), tasks: d.tasks || [],
    })));
  }, [existing.data]);

  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.value);

  const changeDuration = (e) => {
    const n = Number(e.target.value);
    if (n < days.length && days.slice(n).some((d) => d.recipes.length || d.workouts.length || d.tasks.length)) {
      if (!window.confirm(`Reducing to ${n} days will remove the content of days ${n + 1}-${days.length}. Continue?`)) return;
    }
    set('durationDays')(n);
    setDays((cur) => resize(cur, n));
    if (openDay > n) setOpenDay(1);
  };

  const patchDay = (n, patch) => setDays((cur) => cur.map((d) => (d.dayNumber === n ? { ...d, ...patch } : d)));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setError('Title is required.');
    if (!f.goal.trim()) return setError('Goal is required (a short tagline).');
    if (!f.description.trim()) return setError('Description is required.');
    const emptyTitle = days.find((d) => !d.title.trim());
    if (emptyTitle) { setOpenDay(emptyTitle.dayNumber); return setError(`Day ${emptyTitle.dayNumber} needs a title.`); }

    const payloadDays = days.map((d) => ({
      dayNumber: d.dayNumber, title: d.title.trim(), recipes: d.recipes, workouts: d.workouts,
      tasks: d.tasks.map((t) => t.trim()).filter(Boolean),
    }));

    setSaving(true); setError('');
    try {
      const fd = toFormData({
        title: f.title.trim(), description: f.description.trim(), goal: f.goal.trim(),
        durationDays: f.durationDays, isPublished: f.isPublished, days: payloadDays,
      }, file);
      if (editing) await programApi.update(id, fd); else await programApi.create(fd);
      toast.success(editing ? 'Program updated.' : 'Program created.');
      navigate('/admin/programs');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (editing && existing.loading) return <Loading />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const recipeItems = recipes.data?.recipes || [];
  const workoutItems = workouts.data?.workouts || [];

  return (
    <FormShell title={editing ? 'Edit program' : 'New program'} backTo="/admin/programs" backLabel="All programs"
      onSubmit={submit} saving={saving} error={error} submitLabel={editing ? 'Save changes' : 'Create program'}>
      <FormField label="Title" name="title" value={f.title} onChange={onInput('title')} maxLength={120} />
      <FormField label="Goal (short tagline)" name="goal" value={f.goal} onChange={onInput('goal')} placeholder="e.g. Reduce stress" maxLength={120} />
      <TextArea label="Description" name="description" rows={3} value={f.description} onChange={onInput('description')} />
      <SelectField label="Duration" name="durationDays" value={f.durationDays} onChange={changeDuration}>
        {DURATIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
      </SelectField>
      <ImageUpload currentUrl={existing.data?.program?.image?.url} file={file} onChange={setFile} onError={setError} />

      <div className="mb-5">
        <p className="text-sm font-medium text-ink-600 mb-2">Day-by-day plan</p>
        <div className="space-y-2">
          {days.map((d) => {
            const isOpen = openDay === d.dayNumber;
            const filled = d.recipes.length + d.workouts.length + d.tasks.filter((t) => t.trim()).length;
            return (
              <div key={d.dayNumber} className="border border-ink-100 rounded-xl overflow-hidden bg-white">
                <button type="button" onClick={() => setOpenDay(isOpen ? null : d.dayNumber)} aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-rose-50/40">
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-bold text-sm grid place-items-center shrink-0">{d.dayNumber}</span>
                  <span className="flex-1 font-medium truncate">{d.title || 'Untitled'}</span>
                  <span className="text-xs text-ink-400">{filled} item{filled === 1 ? '' : 's'}</span>
                  <span className="text-ink-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-ink-100 bg-ink-50/50">
                    <FormField label="Day title" name={`day-title-${d.dayNumber}`} value={d.title} onChange={(e) => patchDay(d.dayNumber, { title: e.target.value })} maxLength={120} />
                    <ItemPicker label="Recipes" items={recipeItems} value={d.recipes} onChange={(v) => patchDay(d.dayNumber, { recipes: v })} emptyText="No published recipes yet." />
                    <ItemPicker label="Workouts" items={workoutItems} value={d.workouts} onChange={(v) => patchDay(d.dayNumber, { workouts: v })} emptyText="No published workouts yet." />
                    <ListEditor label="Daily habits" items={d.tasks} onChange={(v) => patchDay(d.dayNumber, { tasks: v })} placeholder="e.g. Drink 2L water" addLabel="Add habit" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Toggle label="Published" hint="Drafts are only visible to admins." checked={f.isPublished} onChange={set('isPublished')} />
    </FormShell>
  );
}
