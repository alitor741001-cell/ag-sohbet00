// Tasarım görselindeki sekme düğmelerinin konumları (yüzde, 540x1024 tabanlı).
const TABS = [
  { key: 'chats', label: 'Sohbet', to: '/arkadaslar?view=chats', x: 2, w: 23 },
  { key: 'requests', label: 'Arkadaş İstekleri', to: '/arkadaslar/istekler', x: 26.5, w: 22.5 },
  { key: 'agency', label: 'Ajans Mesajları', to: '/ajans/mesajlar', x: 50.5, w: 23 },
  { key: 'notes', label: 'Sistem Bildirimleri', to: '/bildirimler', x: 75, w: 23 },
];

/** Görseldeki sekmelerin üstüne dokunma alanı + canlı sayaç yerleştirir.
    band: sekme şeridi görselin üst kısmından kırpıldığında (oda içi panel) kullanılır.
    onSelect verilirse (oda içi) sayfa değişmez, sekme anahtarı bildirilir. */
export default function ChatImageTabs({ counts = {}, onSelect, band = false }) {
  const geometry = band ? { top: '51.5%', height: '48.5%' } : { top: '8.5%', height: '8%' };
  return TABS.map((tab) => {
    const count = Number(counts[tab.key] || 0);
    const badge = count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {count > 99 ? '99+' : count}
      </span>
    );
    // Sekmeler artık sayfa açmaz; sadece sayaç gösterir. Açılış listedeki satırlardan yapılır.
    const style = { left: `${tab.x}%`, width: `${tab.w}%`, ...geometry };
    return <span key={tab.key} aria-hidden="true" className="pointer-events-none absolute z-50" style={style}>{badge}</span>;
  });
}