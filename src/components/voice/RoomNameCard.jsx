import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';

/** Oda ismi kartı — yanındaki kalem ile isim yerinde düzenlenir ve odaya işlenir. */
export default function RoomNameCard({ name, canEdit, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name || '');
  const [saving, setSaving] = useState(false);

  // Oda ismi başka yerden değişirse kart kendini günceller.
  useEffect(() => { if (!editing) setDraft(name || ''); }, [name, editing]);

  const submit = async (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setSaving(true);
    const ok = await onRename(value);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
      {editing ? (
        <form onSubmit={submit} className="flex w-full items-center gap-2">
          <input
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Oda ismi"
            className="h-8 min-w-0 flex-1 rounded-lg bg-black/40 px-2.5 text-sm font-bold text-white outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
          >
            Kaydet
          </button>
          <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-[11px] font-bold text-white/60">İptal</button>
        </form>
      ) : (
        <>
          <p className="min-w-0 truncate text-sm font-bold">{name || 'Oda'}</p>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Oda ismini değiştir"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition-transform active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}