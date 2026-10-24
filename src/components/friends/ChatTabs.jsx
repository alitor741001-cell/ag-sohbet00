import { Link } from 'react-router-dom';

const TABS = [
  { key: 'chats', label: 'Sohbet', to: '/arkadaslar?view=chats' },
  { key: 'requests', label: 'Arkadaş İstekleri', to: '/arkadaslar/istekler' },
  { key: 'notes', label: 'Sistem Bildirimleri', to: '/bildirimler' },
  { key: 'agency', label: 'Ajans Mesajları', to: '/ajans/mesajlar' },
];

/** Özel sohbet üst sekmeleri: sayaçlar canlı okunur, sekme kendi sayfasını açar. */
export default function ChatTabs({ counts = {}, active = 'chats' }) {
  return (
    <div className="flex shrink-0 items-stretch gap-1 border-b border-[#F2CE6B]/25 bg-[#07080d] px-1.5 py-1.5">
      {TABS.map((tab) => {
        const count = Number(counts[tab.key] || 0);
        const on = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={`relative flex flex-1 items-center justify-center rounded-xl px-1 py-2 text-center text-[10px] font-bold leading-tight active:scale-95 ${on ? 'bg-[#F2CE6B]/15 text-[#ffeec2]' : 'text-white/80'}`}
          >
            <span>{tab.label}</span>
            {count > 0 && (
              <span className="absolute -top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}