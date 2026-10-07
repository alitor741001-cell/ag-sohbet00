import { ROOM_CATEGORIES } from '@/lib/roomCategories';

/** Oda kategorisi: etiketler seçilebilir çip olarak gösterilir, seçim odaya kaydedilir. */
export default function RoomCategoryChips({ value = '', onChange, disabled = false }) {
  return (
    <section className="mt-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">Kategori</p>
      <div className="flex flex-wrap gap-1.5">
        {ROOM_CATEGORIES.map((label) => {
          const active = value === label;
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange?.(active ? '' : label)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 disabled:opacity-60 ${active ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/80'}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}