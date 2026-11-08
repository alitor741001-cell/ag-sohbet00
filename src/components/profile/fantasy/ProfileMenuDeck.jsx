import useSpriteGrid from '@/hooks/useSpriteGrid';
import ProfileSocialCount from '@/components/profile/social/ProfileSocialCount';

// Profil menüsü tasarımı: 4x4 düğme. Görsel, kendi düğme sınırlarından bölünür ve
// beyaz zemin şeffaf yapılır — düğmeler tam görünür, kesilmez.
const ART = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/ba865902d_profile_menu_grid.jpg';

// Satırlar tasarımdaki sırayla: görseldeki düğme hangi işlevi açıyorsa o eşlenir.
const ROWS = [
  [
    { key: 'friends', label: 'Arkadaşlar' },
    { key: 'following', label: 'Takip Edilenler' },
    { key: 'followers', label: 'Takipçiler' },
    { key: 'visitors', label: 'Ziyaretçiler' },
  ],
  [
    { key: 'coins', label: 'Coins' },
    { key: 'diamonds', label: 'Elmaslar' },
    { key: 'vip', label: 'VIP' },
    { key: 'giftHistory', label: 'Hediye Geçmişi' },
  ],
  [
    { key: 'bag', label: 'Çanta' },
    { key: 'level', label: 'Seviye' },
    { key: 'agency', label: 'Ajans' },
    { key: 'store', label: 'Alışveriş Merkezi' },
  ],
  [
    { key: 'admin', label: 'Yönetici Paneli', adminOnly: true },
    { key: 'blocked', label: 'Engellenen Hesaplar' },
    { key: 'privacy', label: 'Gizlilik Politikası' },
    { key: 'settings', label: 'Ayarlar' },
  ],
];

/**
 * Profil menüsü: tasarım düğmeleri dört satır, dört sütun ızgarada durur ve
 * çentik kenarlarına kadar yayılır. Satırlar mevcut yüksekliği eşit paylaşır.
 */
export default function ProfileMenuDeck({ admin = false, onAction, stats = {} }) {
  const tiles = useSpriteGrid(ART);
  return (
    <div className="grid min-h-0 w-full flex-1 grid-rows-4 gap-2 px-0 py-1">
      {ROWS.map((row, rowIndex) => (
        <div key={row.map((item) => item.key).join('-')} className="grid min-h-0 grid-cols-4 gap-1.5">
          {row.map(({ key, label, adminOnly }, colIndex) => {
            const src = tiles?.[rowIndex]?.[colIndex];
            if (!src || (adminOnly && !admin)) return <div key={key} aria-hidden="true" />;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onAction?.(key)}
                aria-label={label}
                className="relative flex min-h-0 min-w-0 items-center justify-center transition active:scale-95"
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-contain"
                />
                {rowIndex === 0 && <ProfileSocialCount value={stats[key]} unread={key === 'visitors' ? stats.visitors_unread : 0} />}
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}