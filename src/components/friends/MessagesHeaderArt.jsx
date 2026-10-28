import { ART } from '@/lib/designArt';

// Tasarım görselindeki dört neon kartın konumları (yüzde).
const TABS = [
  { key: 'chats', label: 'Sohbet', x: 2, w: 22.5 },
  { key: 'requests', label: 'Arkadaş İstekleri', x: 26.5, w: 22.5 },
  { key: 'agency', label: 'Ajans Mesajları', x: 51, w: 22.5 },
  { key: 'notes', label: 'Sistem Bildirimi', x: 75.5, w: 22.5 },
];

/** Özel mesajlar başlığı: tasarımdaki MESAJLAR yazısı ve dört neon sekme.
    Kartların üstüne dokunma alanı ve canlı sayaç yerleştirilir. */
export default function MessagesHeaderArt({ counts = {}, active = 'chats', onSelect }) {
  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: '852 / 470' }}>
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={ART.messagesHeader}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-x-0 top-0 w-full select-none"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#02030c]" />
      </div>
      {TABS.map((tab) => {
        const count = Number(counts[tab.key] || 0);
        const on = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            aria-label={tab.label}
            aria-pressed={on}
            onClick={() => onSelect?.(tab.key)}
            className={`absolute rounded-xl transition ${on ? 'bg-white/10 ring-2 ring-[#ff2b2b] shadow-[0_0_18px_rgba(255,45,45,0.8)]' : 'active:bg-white/10'}`}
            style={{ left: `${tab.x}%`, width: `${tab.w}%`, top: '47%', height: '32%' }}
          >
            {count > 0 && (
              <span className="absolute -top-1.5 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-black/60">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}