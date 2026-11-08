import { Bell, Building2, MessageCircle, UserPlus } from 'lucide-react';

// Özel mesajlar başlığındaki dört sekme: her sekme kendi renginde yanar.
const TABS = [
  { key: 'chats', label: 'Sohbet', Icon: MessageCircle, bg: 'linear-gradient(120deg,#9bf6ff 0%,#2f7cff 55%,#0b2f8f 100%)', glow: '0 0 14px -3px rgba(60,160,255,0.95)' },
  { key: 'requests', label: 'İstekler', Icon: UserPlus, bg: 'linear-gradient(120deg,#ffe08a 0%,#ff9a3c 55%,#b83300 100%)', glow: '0 0 14px -3px rgba(255,138,43,0.95)' },
  { key: 'agency', label: 'Ajans', Icon: Building2, bg: 'linear-gradient(120deg,#e9b6ff 0%,#a855f7 55%,#4c0b8f 100%)', glow: '0 0 14px -3px rgba(168,85,247,0.95)' },
  { key: 'notes', label: 'Bildirim', Icon: Bell, bg: 'linear-gradient(120deg,#ffd0e2 0%,#ff5c8a 55%,#8f0b3d 100%)', glow: '0 0 14px -3px rgba(255,92,138,0.95)' },
];

/** Özel mesajlar başlığı: neon başlık ve dört renkli alevli sekme (görsel kullanılmaz). */
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
        {TABS.map(({ key, label, Icon, bg, glow }) => {
          const on = active === key;
          const count = Number(counts[key] || 0);
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={on}
              onClick={() => onSelect?.(key)}
              className={`flame-live relative flex flex-col items-center gap-1 rounded-2xl border border-white/45 py-1.5 text-white active:scale-95 ${on ? 'ring-2 ring-white/85' : 'opacity-90'}`}
              style={{ backgroundImage: bg, boxShadow: glow }}
            >
              <Icon aria-hidden="true" className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" strokeWidth={on ? 2.7 : 2.2} />
              <span className="text-[9px] font-black uppercase tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
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