import { useCutoutGrid } from '@/hooks/useCutoutSprites';

// Gönderilen tasarım sayfası: 4 satır, her satırda 4 düğme. Beyaz zemin kaldırılıp
// düğmeler şeffaf PNG olarak eşit ızgaraya yerleştirilir.
const IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f4ad103b6_IMG_0527.jpg';

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
 * Profil menüsü: düğmeler dört satır, dört sütun ızgarada durur ve çentik kenarlarına
 * kadar yayılır. Satırlar mevcut yüksekliği eşit paylaşır; düğmeler kırpılmaz.
 */
export default function ProfileMenuDeck({ admin = false, onAction }) {
  // Kırpma açık: hücrelerin şeffaf kenar boşlukları atılır, geriye yalnızca düğmenin
  // kendisi kalır — düğmelerin üstünde ve altında tasarım parçası görünmez.
  const tiles = useCutoutGrid(IMAGE, 4, 4, true);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-4">
      {ROWS.map((row, rowIndex) => (
        <div key={row.join('-')} className="grid min-h-0 grid-cols-4 items-center">
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