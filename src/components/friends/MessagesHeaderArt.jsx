import { Bell, Building2, MessageCircle, UserPlus } from 'lucide-react';

// Özel mesajlar başlığındaki dört sekme.
const TABS = [
  { key: 'chats', label: 'Sohbet', Icon: MessageCircle },
  { key: 'requests', label: 'İstekler', Icon: UserPlus },
  { key: 'agency', label: 'Ajans', Icon: Building2 },
  { key: 'notes', label: 'Bildirim', Icon: Bell },
];

/** Özel mesajlar başlığı: neon başlık ve dört hafif sekme (görsel kullanılmaz). */
export default function MessagesHeaderArt({ counts = {}, active = 'chats', onSelect }) {
  return (
    <div className="w-full shrink-0 px-3 pt-3">
      <div className="flex items-center justify-between px-1">
        <h1
          className="text-base font-black uppercase tracking-[0.22em] text-white"
          style={{ textShadow: '0 0 8px rgba(239,68,68,0.95), 0 0 22px rgba(239,68,68,0.55)' }}
        >
          Mesajlar
        </h1>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_rgba(239,68,68,0.9)]" />
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {TABS.map(({ key, label, Icon }) => {
          const on = active === key;
          const count = Number(counts[key] || 0);
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={on}
              onClick={() => onSelect?.(key)}
              className={
                on
                  ? 'relative flex flex-col items-center gap-1 rounded-xl border border-primary/55 bg-primary/15 py-1.5 shadow-[0_0_18px_-4px_rgba(239,68,68,0.95)] active:scale-95'
                  : 'relative flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 active:scale-95'
              }
            >
              <Icon
                aria-hidden="true"
                className={on ? 'h-4 w-4 text-white' : 'h-4 w-4 text-white/55'}
                strokeWidth={on ? 2.6 : 2.1}
              />
              <span className={on ? 'text-[9px] font-black uppercase tracking-wide text-white' : 'text-[9px] font-bold uppercase tracking-wide text-white/55'}>
                {label}
              </span>
              {count > 0 && (
                <span className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-black/60">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}