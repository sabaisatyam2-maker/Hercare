import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { categoryApi, recipeApi, toFormData } from '../../api/services';
import { DIET_TAGS } from '../../utils/constants';
import { getErrorMessage, humanize } from '../../utils/format';
import { FormField, SelectField, TextArea } from '../../components/FormField';
import { ChipSelect, ImageUpload, ListEditor, Toggle } from '../../components/AdminUI';
import { FormShell } from '../../components/FormShell';
import { ErrorState, Loading } from '../../components/States';

const clean = (arr) => arr.map((s) => s.trim()).filter(Boolean);

export default function RecipeForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const cats = useApi((s) => categoryApi.list('recipe', s), []);
  const existing = useApi((s) => recipeApi.adminGet(id, s), [id], { enabled: editing });

  const [f, setF] = useState({
    title: '', category: '', description: '', prepTimeMinutes: '', servings: '',
    ingredients: [''], instructions: [''], dietTags: [], isPublished: true,
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = existing.data?.recipe;
    if (!r) return;
    setF({
      title: r.title, category: r.category?._id || '', description: r.description,
      prepTimeMinutes: r.prepTimeMinutes, servings: r.servings,
      ingredients: r.ingredients.length ? r.ingredients : [''],
      instructions: r.instructions.length ? r.instructions : [''],
      dietTags: r.dietTags || [], isPublished: r.isPublished,
    });
  }, [existing.data]);

  const set = (k) => (v) => setF((cur) => ({ ...cur, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    const ingredients = clean(f.ingredients);
    const instructions = clean(f.instructions);
    const prep = Number(f.prepTimeMinutes);
    const servings = Number(f.servings);

    if (!f.title.trim()) return setError('Title is required.');
    if (!f.category) return setError('Please choose a category.');
    if (!f.description.trim()) return setError('Description is required.');
    if (ingredients.length === 0) return setError('Add at least one ingredient.');
    if (instructions.length === 0) return setError('Add at least one instruction step.');
    if (!Number.isInteger(prep) || prep < 1 || prep > 1440) return setError('Prep time must be a whole number of minutes (1-1440).');
    if (!Number.isInteger(servings) || servings < 1 || servings > 100) return setError('Servings must be a whole number (1-100).');

    setSaving(true); setError('');
    try {
      const fd = toFormData({
        title: f.title.trim(), category: f.category, description: f.description.trim(),
        ingredients, instructions, prepTimeMinutes: prep, servings,
        dietTags: f.dietTags, isPublished: f.isPublished,
      }, file);
      if (editing) await recipeApi.update(id, fd); else await recipeApi.create(fd);
      toast.success(editing ? 'Recipe updated.' : 'Recipe created.');
      navigate('/admin/recipes');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (editing && existing.loading) return <Loading />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const categories = Array.isArray(cats.data) ? cats.data : [];

  return (
    <FormShell title={editing ? 'Edit recipe' : 'New recipe'} backTo="/admin/recipes" backLabel="All recipes"
      onSubmit={submit} saving={saving} error={error} submitLabel={editing ? 'Save changes' : 'Create recipe'}>
      <FormField label="Title" name="title" value={f.title} onChange={onInput('title')} maxLength={120} />
      <SelectField label="Category" name="category" value={f.category} onChange={onInput('category')}>
        <option value="">Select a category...</option>
        {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </SelectField>
      {!cats.loading && categories.length === 0 && (
        <p className="text-xs text-rose-500 -mt-3 mb-4">No recipe categories yet. Create one in Categories first.</p>
      )}
      <TextArea label="Description" name="description" rows={3} value={f.description} onChange={onInput('description')} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Prep time (minutes)" name="prep" type="number" min="1" max="1440" value={f.prepTimeMinutes} onChange={onInput('prepTimeMinutes')} />
        <FormField label="Servings" name="servings" type="number" min="1" max="100" value={f.servings} onChange={onInput('servings')} />
      </div>
      <ListEditor label="Ingredients" items={f.ingredients} onChange={set('ingredients')} placeholder="e.g. 1 cup rolled oats" addLabel="Add ingredient" />
      <ListEditor label="Instructions" items={f.instructions} onChange={set('instructions')} placeholder="Describe this step" addLabel="Add step" multiline />
      <ChipSelect label="Diet tags" options={DIET_TAGS} value={f.dietTags} onChange={set('dietTags')} format={humanize} />
      <ImageUpload currentUrl={existing.data?.recipe?.image?.url} file={file} onChange={setFile} onError={setError} />
      <Toggle label="Published" hint="Drafts are only visible to admins." checked={f.isPublished} onChange={set('isPublished')} />
    </FormShell>
  );
}
