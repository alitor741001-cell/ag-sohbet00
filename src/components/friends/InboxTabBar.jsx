const TABS = [
  { key: 'chats', label: 'Sohbet' },
  { key: 'requests', label: 'İstekler' },
  { key: 'agency', label: 'Ajans' },
  { key: 'notes', label: 'Bildirim' },
];

/** Özel mesajlar ekranının sekme çubuğu: sayaçlı, dokunulabilir düğmeler. */
export default function InboxTabBar({ counts = {}, active = 'chats', onSelect }) {
  return (
    <div className="mx-[5%] mb-2 flex gap-1.5">
      {TABS.map((tab) => {
        const count = Number(counts[tab.key] || 0);
        const on = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect?.(tab.key)}
            className={`relative min-h-9 flex-1 rounded-lg px-1 text-[11px] font-bold transition-colors ${
              on ? 'bg-[#ef4343]/20 text-white ring-1 ring-[#ef4343]' : 'bg-black/50 text-white/70'
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[10px] font-bold leading-none text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}