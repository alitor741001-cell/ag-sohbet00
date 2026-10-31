import { useCutoutGrid } from '@/hooks/useCutoutSprites';

// Tek tasarım sayfası: 4 satır, her satırda 4 düğme. Düğmeler beyaz zeminlerinden
// ayrılıp şeffaf PNG olarak yerleştirilir, aralarında boşluk bırakılır.
const IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/4922623d2_IMG_0527.jpg';

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

const ROW_HEIGHT = 'clamp(56px, 16.5vw, 84px)';

/**
 * Profil menüsü: düğmeler referans tasarımdaki düzende, aralarında boşluk olacak
 * şekilde dört satır halinde dizilir. Yönetici düğmesi yalnızca yöneticilerde görünür;
 * yerine boşluk bırakılır, diğer düğmeler yerinden kaymaz.
 */
export default function ProfileMenuDeck({ admin = false, onAction }) {
  const sprites = useCutoutGrid(IMAGE, 4, 4);

  return (
    <div className="-mx-4 flex min-h-0 w-[calc(100%+2rem)] flex-1 flex-col justify-center gap-1">
      {ROWS.map((row, rowIndex) => (
        <div
          key={row.join('-')}
          className="grid w-full items-center gap-1"
          style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', height: ROW_HEIGHT }}
        >
          {row.map((action, colIndex) => {
            const sprite = sprites[rowIndex * 4 + colIndex];
            if (action === 'admin' && !admin) return <div key={action} aria-hidden="true" />;
            return (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                aria-label={LABELS[action]}
                className="flex h-full w-full items-center justify-center transition-transform active:scale-95"
              >
                {sprite ? (
                  <img src={sprite.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}