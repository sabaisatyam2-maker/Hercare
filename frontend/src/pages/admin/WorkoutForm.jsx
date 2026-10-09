import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { categoryApi, workoutApi, toFormData } from '../../api/services';
import { DIFFICULTIES, INTENSITIES } from '../../utils/constants';
import { getErrorMessage, humanize } from '../../utils/format';
import { FormField, SelectField, TextArea } from '../../components/FormField';
import { ImageUpload, ListEditor, Toggle } from '../../components/AdminUI';
import { FormShell } from '../../components/FormShell';
import { ErrorState, Loading } from '../../components/States';

const clean = (arr) => arr.map((s) => s.trim()).filter(Boolean);

export default function WorkoutForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const cats = useApi((s) => categoryApi.list('workout', s), []);
  const existing = useApi((s) => workoutApi.adminGet(id, s), [id], { enabled: editing });

  const [f, setF] = useState({
    title: '', category: '', description: '', durationMinutes: '', difficulty: 'beginner',
    intensity: 'low-impact', videoUrl: '', steps: [''], equipmentNeeded: [], isPublished: true,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const w = existing.data?.workout;
    if (!w) return;
    setF({
      title: w.title, category: w.category?._id || '', description: w.description,
      durationMinutes: w.durationMinutes, difficulty: w.difficulty, intensity: w.intensity,
      videoUrl: w.videoUrl || '', steps: w.steps.length ? w.steps : [''],
      equipmentNeeded: w.equipmentNeeded || [], isPublished: w.isPublished,
    });
  }, [existing.data]);

  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    const steps = clean(f.steps);
    const equipment = clean(f.equipmentNeeded);
    const duration = Number(f.durationMinutes);
    const video = f.videoUrl.trim();

    if (!f.title.trim()) return setError('Title is required.');
    if (!f.category) return setError('Please choose a category.');
    if (!f.description.trim()) return setError('Description is required.');
    if (steps.length === 0) return setError('Add at least one step.');
    if (!Number.isInteger(duration) || duration < 1) return setError('Duration must be a whole number of minutes (1 or more).');
    if (video && !/^https?:\/\/\S+$/i.test(video)) return setError('Video link must start with http:// or https://');

    setSaving(true); setError('');
    try {
      const fd = toFormData({
        title: f.title.trim(), category: f.category, description: f.description.trim(),
        steps, durationMinutes: duration, difficulty: f.difficulty, intensity: f.intensity,
        equipmentNeeded: equipment, videoUrl: video, isPublished: f.isPublished,
      }, file);
      if (editing) await workoutApi.update(id, fd); else await workoutApi.create(fd);
      toast.success(editing ? 'Workout updated.' : 'Workout created.');
      navigate('/admin/workouts');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (editing && existing.loading) return <Loading />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const categories = Array.isArray(cats.data) ? cats.data : [];

  return (
    <FormShell title={editing ? 'Edit workout' : 'New workout'} backTo="/admin/workouts" backLabel="All workouts"
      onSubmit={submit} saving={saving} error={error} submitLabel={editing ? 'Save changes' : 'Create workout'}>
      <FormField label="Title" name="title" value={f.title} onChange={onInput('title')} maxLength={120} />
      <SelectField label="Category" name="category" value={f.category} onChange={onInput('category')}>
        <option value="">Select a category...</option>
        {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </SelectField>
      {!cats.loading && categories.length === 0 && (
        <p className="text-xs text-rose-500 -mt-3 mb-4">No workout categories yet. Create one in Categories first.</p>
      )}
      <TextArea label="Description" name="description" rows={3} value={f.description} onChange={onInput('description')} />
      <div className="grid sm:grid-cols-3 gap-4">
        <FormField label="Duration (minutes)" name="duration" type="number" min="1" value={f.durationMinutes} onChange={onInput('durationMinutes')} />
        <SelectField label="Difficulty" name="difficulty" value={f.difficulty} onChange={onInput('difficulty')}>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
        </SelectField>
        <SelectField label="Intensity" name="intensity" value={f.intensity} onChange={onInput('intensity')}>
          {INTENSITIES.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
        </SelectField>
      </div>
      <ListEditor label="Steps" items={f.steps} onChange={set('steps')} placeholder="Describe this step" addLabel="Add step" multiline />
      <ListEditor label="Equipment (optional)" items={f.equipmentNeeded} onChange={set('equipmentNeeded')} placeholder="e.g. Yoga mat" addLabel="Add equipment" />
      <FormField label="Demo video link (optional)" name="videoUrl" type="url" value={f.videoUrl} onChange={onInput('videoUrl')} placeholder="https://..." />
      <ImageUpload currentUrl={existing.data?.workout?.image?.url} file={file} onChange={setFile} onError={setError} />
      <Toggle label="Published" hint="Drafts are only visible to admins." checked={f.isPublished} onChange={set('isPublished')} />
    </FormShell>
  );
}
