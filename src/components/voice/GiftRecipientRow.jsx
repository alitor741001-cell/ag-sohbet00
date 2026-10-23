import { Check, Users } from 'lucide-react';

/** Hediye alıcıları: odadaki kişiler çoklu seçilebilir, seçim rengi hediyenin K seviyesinden gelir. */
export default function GiftRecipientRow({ people = [], selectedIds = [], color, onToggle, onSelectAll, onClear }) {
  const allSelected = people.length > 0 && selectedIds.length >= people.length;

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
          Alıcılar {selectedIds.length > 0 && <span style={{ color }}>• {selectedIds.length} kişi</span>}
        </p>
        {people.length > 0 && (
          <button
            type="button"
            onClick={() => (allSelected ? onClear() : onSelectAll())}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-transform"
          >
            <Users className="h-3.5 w-3.5" /> {allSelected ? 'Seçimi temizle' : 'Tümünü seç'}
          </button>
        )}
      </div>
      {people.length === 0 ? (
        <p className="rounded-xl bg-white/5 px-3 py-2 text-[11px] text-white/50">Odada hediye gönderilecek başka kişi yok.</p>
      ) : (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {people.map((person) => {
            const selected = selectedIds.includes(person.user_id);
            return (
              <button
                key={person.user_id}
                type="button"
                onClick={() => onToggle(person.user_id)}
                aria-pressed={selected}
                className="relative flex w-12 shrink-0 flex-col items-center gap-1"
              >
                <span
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10"
                  style={selected ? { boxShadow: `0 0 0 2px ${color}, 0 0 14px ${color}` } : undefined}
                >
                  {person.avatar ? (
                    <img src={person.avatar} alt={person.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" draggable={false} />
                  ) : (
                    <span className="text-sm font-bold text-white">{(person.name || '?')[0]}</span>
                  )}
                  {selected && (
                    <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: color }}>
                      <Check className="h-3 w-3 text-black" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[10px] leading-none" style={{ color: selected ? color : 'rgba(255,255,255,0.7)' }}>
                  {person.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}