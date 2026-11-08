import { Link } from 'react-router-dom';
import { Flame, Plus, Search, Users } from 'lucide-react';

const VIEWS = [
  { key: 'hot', label: 'Sıcak', Icon: Flame },
  { key: 'history', label: 'Takip', Icon: Users },
];

/**
 * Ana sayfa üst şeridi: marka satırı, canlı/takip görünüm seçici, arama ve oda kurma.
 * Tüm düğmeler bağlıdır; seçili görünüm kırmızı vurguyla gösterilir.
 */
export default function HomeTopBar({ view = 'hot', onView, onSearch, showViews = true }) {
  return (
    <header className="border-b border-border bg-[#0b0b0f]">
      <div className="mx-auto w-full max-w-[36rem] px-3 pb-2.5 pt-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[13px] font-black text-primary-foreground">
            AG
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-black tracking-wide text-white">AG SOHBET</p>
            <p className="truncate text-[10px] font-semibold text-white/45">Canlı odalar ve sohbet</p>
          </div>
          <button
            type="button"
            aria-label="Ara"
            onClick={() => onSearch?.()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/5 text-white/80 active:scale-95"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          {showViews && (
            <div className="flex items-center gap-1 rounded-full border border-border bg-white/5 p-1">
              {VIEWS.map(({ key, label, Icon }) => {
                const active = view === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onView?.(key)}
                    aria-pressed={active}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition active:scale-95 ${
                      active ? 'bg-primary text-primary-foreground' : 'text-white/65'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex-1" />
          <Link
            to="/oda-kur"
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11.5px] font-bold text-primary-foreground active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Oda Kur
          </Link>
        </div>
      </div>
    </header>
  );
}