import { useBorderWhiteCutout } from '@/lib/whiteCutout';

const DECK_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c5c25b04b_IMG_0488.jpg';
const CROP = { x: 0, y: 0, w: 1, h: 1 };

// Görseldeki dört satır: her satır kendi eylemlerini taşır.
const ROWS = [
  { top: 0, height: 0.23, actions: ['friends', 'following', 'followers', 'visitors'] },
  { top: 0.23, height: 0.21, actions: ['coins', 'diamonds'] },
  { top: 0.44, height: 0.21, actions: ['vip', 'giftHistory'] },
  { top: 0.65, height: 0.35, actions: ['admin', 'blocked', 'settings'] },
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
  admin: 'Yönetim',
  blocked: 'Engellenen Hesaplar',
  settings: 'Ayarlar',
};

/**
 * Profil eylem panosu: sosyal sayaçlar, bakiye, VIP, hediye geçmişi ve
 * yönetim/ayar şeridi tek tasarım görseli üzerinde dokunulabilir bölgelerdir.
 */
export default function ProfileActionDeck({ onAction }) {
  const src = useBorderWhiteCutout(DECK_IMAGE, CROP);

  return (
    <div className="relative w-full">
      {src ? (
        <img src={src} alt="Profil menüsü" draggable={false} className="block h-auto w-full select-none" />
      ) : (
        <div className="aspect-[1024/808] w-full" aria-hidden="true" />
      )}
      {src && (
        <div className="absolute inset-0">
          {ROWS.map((row) => (
            <div
              key={row.top}
              className="absolute left-0 grid w-full"
              style={{ top: `${row.top * 100}%`, height: `${row.height * 100}%`, gridTemplateColumns: `repeat(${row.actions.length}, minmax(0, 1fr))` }}
            >
              {row.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onAction?.(action)}
                  aria-label={LABELS[action]}
                  className="rounded-xl transition-colors active:bg-white/10"
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}