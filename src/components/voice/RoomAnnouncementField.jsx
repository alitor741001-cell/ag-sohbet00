import { useEffect, useState } from 'react';

/**
 * Duyuru alanı: kaydedilen metin oda kaydına yazılır ve kayıt defterine (cheat paneli) düşer;
 * odaya giren herkese de aynı duyuru kayıt defterine işlenir.
 */
export default function RoomAnnouncementField({ value = '', canEdit = false, onSave }) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  // Duyuru başka yerden değişirse alan kendini günceller.
  useEffect(() => { setDraft(value); }, [value]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    await onSave?.(draft.trim());
    setSaving(false);
  };

  return (
    <section className="mt-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Duyuru</p>
      {canEdit ? (
        <form onSubmit={submit} className="flex items-end gap-2">
          <textarea
            value={draft}
            maxLength={200}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Odayla ilgili duyuru yaz"
            className="min-h-[52px] min-w-0 flex-1 resize-none rounded-xl bg-black/40 px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
          >
            Kaydet
          </button>
        </form>
      ) : (
        <p className="rounded-xl bg-black/30 px-2.5 py-2 text-xs text-white/80">{value || 'Duyuru yok.'}</p>
      )}
    </section>
  );
}