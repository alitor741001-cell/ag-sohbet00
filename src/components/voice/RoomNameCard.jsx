import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';

// Bu uzunluktan sonra isim soldan akmaya başlar.
const MARQUEE_AFTER = 10;

/**
 * Oda ismi kartı: profilin altında ortalanır, kendi yazısı kadar büyür.
 * İsim 10 harften uzunsa sürekli sola akar ve her turda baştan tekrarlar.
 */
export default function RoomNameCard({ name, canEdit, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name || '');
  const [saving, setSaving] = useState(false);

  const label = name || 'Oda';
  const scrolls = label.length > MARQUEE_AFTER;

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

  if (editing) {
    return (
      <div className="mt-2 w-fit max-w-[86vw] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Oda ismi"
            className="h-8 w-[44vw] max-w-[15rem] rounded-lg bg-black/40 px-2.5 text-sm font-bold text-white outline-none placeholder:text-white/40"
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
      </div>
    );
  }

  return (
    <div className="relative mt-2 flex w-fit max-w-[86vw] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-2">
      {scrolls ? (
        <span className="overflow-hidden" style={{ maxWidth: '56vw' }}>
          <span
            className="room-name-marquee flex w-max whitespace-nowrap"
            style={{ animationDuration: `${Math.max(8, label.length * 0.5)}s` }}
          >
            <span className="pr-8 text-sm font-bold">{label}</span>
            <span className="pr-8 text-sm font-bold" aria-hidden="true">{label}</span>
          </span>
        </span>
      ) : (
        <span className="whitespace-nowrap text-sm font-bold">{label}</span>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Oda ismini değiştir"
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/75 transition-transform active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}