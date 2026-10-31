import { useCutoutGrid } from '@/hooks/useCutoutSprites';

// Tek tasarım sayfası: 4 satır, her satırda 4 düğme. Düğmeler arkasındaki tasarımdan
// ayrılıp şeffaf PNG olarak eşit ızgaraya yerleştirilir.
const IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a312c9cda_IMG_0527.jpg';

const ROWS = [
  ['friends', 'following', 'followers', 'visitors'],
  ['coins', 'diamonds', 'vip', 'giftHistory'],
  ['store', 'bag', 'level', 'agency'],
  ['admin', 'blocked', 'privacy', 'settings'],
];

const LABELS = {
  friends: 'Arkadaşlar',
  following: 'Takip Edilenler',
  followers: 'Takipçiler',
  visitors: 'Ziyaretçiler',
  coins: 'Coins',
  diamonds: 'Elmaslar',
  vip: 'VIP',
  giftHistory: 'Hediye Geçmişi',
  store: 'Alışveriş Merkezi',
  bag: 'Çanta',
  level: 'Seviye',
  agency: 'Ajans',
  admin: 'Yönetici Paneli',
  blocked: 'Engellenen Hesaplar',
  privacy: 'Gizlilik Politikası',
  settings: 'Ayarlar',
};

/**
 * Profil menüsü: düğmeler dört satır, dört sütun ızgarada durur ve kenarlara kadar yayılır.
 * Satırlar mevcut yüksekliği eşit paylaşır; düğmeler kırpılmaz, üst üste binmez.
 */
export default function ProfileMenuDeck({ admin = false, onAction }) {
  const tiles = useCutoutGrid(IMAGE, 4, 4);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-4 gap-y-1.5 py-0.5">
      {ROWS.map((row, rowIndex) => (
        <div key={row.join('-')} className="grid min-h-0 grid-cols-4 items-center gap-x-1">
          {row.map((action, colIndex) => {
            const tile = tiles[rowIndex * 4 + colIndex];
            if (action === 'admin' && !admin) return <div key={action} aria-hidden="true" />;
            // Dış sütunlar ekranın kenarına yaslanır: arkadaşlar sola, ayarlar sağa doğru genişler.
            const align = colIndex === 0 ? 'justify-start' : colIndex === 3 ? 'justify-end' : 'justify-center';
            return (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                aria-label={LABELS[action]}
                className={`flex h-full w-full items-center ${align} transition-transform active:scale-95`}
              >
                {tile ? (
                  <img src={tile.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}