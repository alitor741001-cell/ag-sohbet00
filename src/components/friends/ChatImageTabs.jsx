// Tasarım görselindeki sekme düğmelerinin konumları (yüzde, 540x1024 tabanlı).
const TABS = [
  { key: 'chats', label: 'Sohbet', x: 2, w: 23 },
  { key: 'requests', label: 'Arkadaş İstekleri', x: 26.5, w: 22.5 },
  { key: 'agency', label: 'Ajans Mesajları', x: 50.5, w: 23 },
  { key: 'notes', label: 'Sistem Bildirimleri', x: 75, w: 23 },
];

/** Görseldeki sekmelerin üstüne dokunma alanı + canlı sayaç yerleştirir.
    Sekmeler sayfa değiştirmez; seçilen sekme parlar ve içerik aynı ekranda değişir. */
export default function ChatImageTabs({ counts = {}, active = 'chats', onSelect, band = false }) {
  const geometry = band ? { top: '51.5%', height: '48.5%' } : { top: '8.5%', height: '8%' };
  return TABS.map((tab) => {
    const count = Number(counts[tab.key] || 0);
    const on = active === tab.key;
    return (
      <button
        key={tab.key}
        type="button"
        aria-label={tab.label}
        aria-pressed={on}
        onClick={() => onSelect?.(tab.key)}
        className={`absolute z-50 rounded-xl transition-all active:bg-white/10 ${on ? 'bg-red-500/15 ring-2 ring-red-400 shadow-[0_0_14px_rgba(248,113,113,0.9),inset_0_0_10px_rgba(248,113,113,0.5)]' : ''}`}
        style={{ left: `${tab.x}%`, width: `${tab.w}%`, ...geometry }}
      >
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    );
  });
}