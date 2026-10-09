import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

/** Image picker with preview + the same limits the backend enforces (jpg/png/webp, 5MB). */
export function ImageUpload({ currentUrl, file, onChange, onError }) {
  const [preview, setPreview] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { onError?.('Only JPG, PNG or WEBP images are allowed.'); return; }
    if (f.size > 5 * 1024 * 1024) { onError?.('Image must be 5MB or smaller.'); return; }
    onError?.('');
    onChange(f);
  };

  const shown = preview || currentUrl;
  return (
    <div className="mb-4">
      <p className="block text-sm font-medium text-ink-600 mb-1.5">Image</p>
      <div className="flex items-center gap-4">
        <div className="w-28 h-20 rounded-xl overflow-hidden bg-ink-50 border border-ink-100 grid place-items-center text-ink-400 text-xs">
          {shown ? <img src={shown} alt="" className="w-full h-full object-cover" /> : 'No image'}
        </div>
        <div className="flex flex-col gap-2 items-start">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {shown ? 'Change image' : 'Choose image'}
          </Button>
          {file && <button type="button" onClick={() => onChange(null)} className="text-xs text-ink-400 hover:text-rose-500">Remove new image</button>}
          <p className="text-xs text-ink-400">JPG, PNG or WEBP, up to 5MB.</p>
        </div>
      </div>
    </div>
  );
}

/** Editable list of text lines (ingredients, steps...). Items are plain strings. */
export function ListEditor({ label, items, onChange, placeholder, addLabel = 'Add item', multiline = false }) {
  const update = (i, v) => onChange(items.map((x, idx) => (idx === i ? v : x)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div className="mb-5">
      <p className="block text-sm font-medium text-ink-600 mb-1.5">{label}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="w-6 h-10 grid place-items-center text-xs text-ink-400 shrink-0">{i + 1}</span>
            {multiline
              ? <textarea className="input !py-2" rows={2} value={it} placeholder={placeholder} onChange={(e) => update(i, e.target.value)} />
              : <input className="input" value={it} placeholder={placeholder} onChange={(e) => update(i, e.target.value)} />}
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30"><Icon name="up" className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30"><Icon name="down" className="w-4 h-4" /></button>
            </div>
            <button type="button" onClick={() => remove(i)} aria-label="Remove" className="p-2 text-ink-400 hover:text-rose-500"><Icon name="trash" className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...items, ''])}>
        <Icon name="plus" className="w-4 h-4" /> {addLabel}
      </Button>
    </div>
  );
}

export function ChipSelect({ label, options, value, onChange, format = (x) => x }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="mb-5">
      <p className="block text-sm font-medium text-ink-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={value.includes(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${value.includes(o) ? 'bg-lavender-500 border-lavender-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-lavender-300'}`}>
            {format(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-ink-50 mb-5 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-400 mt-0.5">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <span className="w-11 h-6 rounded-full bg-ink-200 peer-checked:bg-rose-500 relative transition-colors shrink-0
        after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function StatusBadge({ published }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${published ? 'bg-green-50 text-green-700' : 'bg-ink-100 text-ink-600'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

/** Searchable multi-select used for picking recipes/workouts inside a program day. */
export function ItemPicker({ label, items, value, onChange, emptyText = 'Nothing available yet.' }) {
  const [q, setQ] = useState('');
  const selected = items.filter((i) => value.includes(i._id));
  const matches = items
    .filter((i) => !value.includes(i._id) && i.title.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 6);

  return (
    <div className="mb-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selected.map((i) => (
          <span key={i._id} className="chip !bg-rose-50 !text-rose-600 !border-rose-100">
            {i.title}
            <button type="button" aria-label={`Remove ${i.title}`} onClick={() => onChange(value.filter((v) => v !== i._id))} className="ml-1 font-bold">×</button>
          </span>
        ))}
        {value.length > selected.length && <span className="chip">{value.length - selected.length} unavailable</span>}
      </div>
      {items.length === 0 ? <p className="text-xs text-ink-400">{emptyText}</p> : (
        <>
          <input className="input !py-1.5 !text-sm" placeholder="Search to add..." value={q} onChange={(e) => setQ(e.target.value)} />
          {q.trim() && (
            <ul className="mt-1.5 border border-ink-100 rounded-xl overflow-hidden bg-white">
              {matches.length === 0 && <li className="px-3 py-2 text-xs text-ink-400">No matches</li>}
              {matches.map((i) => (
                <li key={i._id}>
                  <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-rose-50"
                    onClick={() => { onChange([...value, i._id]); setQ(''); }}>+ {i.title}</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
