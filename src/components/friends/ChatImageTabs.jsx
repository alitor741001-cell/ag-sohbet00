import { Link } from 'react-router-dom';

// Tasarım görselindeki sekme düğmelerinin konumları (yüzde, 540x1024 tabanlı).
const TABS = [
  { key: 'chats', label: 'Sohbet', to: '/arkadaslar?view=chats', x: 2, w: 23 },
  { key: 'requests', label: 'Arkadaş İstekleri', to: '/arkadaslar/istekler', x: 26.5, w: 22.5 },
  { key: 'agency', label: 'Ajans Mesajları', to: '/ajans/mesajlar', x: 50.5, w: 23 },
  { key: 'notes', label: 'Sistem Bildirimleri', to: '/bildirimler', x: 75, w: 23 },
];

/** Görseldeki sekmelerin üstüne dokunma alanı + canlı sayaç yerleştirir.
    onSelect verilirse (oda içi) sayfa değişmez, sekme anahtarı bildirilir. */
export default function ChatImageTabs({ counts = {}, onSelect }) {
  return TABS.map((tab) => {
    const count = Number(counts[tab.key] || 0);
    const badge = count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {count > 99 ? '99+' : count}
      </span>
    );
    const className = 'absolute z-50 rounded-xl active:bg-white/10';
    const style = { left: `${tab.x}%`, width: `${tab.w}%`, top: '8.5%', height: '8%' };
    if (onSelect) {
      return <button key={tab.key} type="button" aria-label={tab.label} onClick={() => onSelect(tab.key)} className={className} style={style}>{badge}</button>;
    }
    return <Link key={tab.key} to={tab.to} aria-label={tab.label} className={className} style={style}>{badge}</Link>;
  });
}