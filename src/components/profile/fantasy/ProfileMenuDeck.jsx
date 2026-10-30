import { useBorderWhiteCutout } from '@/lib/whiteCutout';

// Yönetici tasarımı (en altta yönetim paneli) ve üye tasarımı (yönetim paneli yok).
const ADMIN_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7cf1dceb7_IMG_0491.jpg';
const USER_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a6804107b_IMG_0492.jpg';
const CROP = { x: 0, y: 0, w: 1, h: 1 };

// Görseldeki satırlar, dokunulabilir bölgeler ve gerçek değerin yazıldığı yer.
const ROWS = [
  { top: 0, height: 0.175, actions: ['friends', 'following', 'followers', 'visitors'], valueStyle: 'nav' },
  { top: 0.175, height: 0.17, actions: ['coins', 'diamonds'], valueStyle: 'amount' },
  { top: 0.345, height: 0.17, actions: ['vip', 'giftHistory'] },
  { top: 0.515, height: 0.22, actions: ['store', 'bag', 'level', 'agency'] },
];
const ADMIN_TAIL = ['admin', 'blocked', 'privacy', 'settings'];
const USER_TAIL = ['blocked', 'privacy', 'settings'];

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

const VALUE_CLASS = {
  nav: 'text-[12px] font-extrabold tabular-nums text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]',
  amount: 'text-[14px] font-extrabold tabular-nums text-amber-100 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]',
};

function formatValue(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString('tr-TR');
}

/**
 * Profil menüsü: yönetici hesapta yönetim paneli satırı olan tasarım, üyelerde ise
 * yönetim paneli bulunmayan tasarım gösterilir. Arkadaş/takip/ziyaretçi sayıları ile
 * coins ve elmas tutarları tasarımın üzerine gerçek verilerle yazılır.
 */
export default function ProfileMenuDeck({ admin = false, stats = {}, onAction }) {
  const src = useBorderWhiteCutout(admin ? ADMIN_IMAGE : USER_IMAGE, CROP);
  const rows = [...ROWS, { top: 0.735, height: 0.265, actions: admin ? ADMIN_TAIL : USER_TAIL }];

  return (
    <div className="relative w-full">
      {src ? (
        <img src={src} alt="Profil menüsü" draggable={false} className="block h-auto w-full select-none" />
      ) : (
        <div className="aspect-[1024/970] w-full" aria-hidden="true" />
      )}
      {src && (
        <div className="absolute inset-0">
          {rows.map((row) => (
            <div
              key={row.top}
              className="absolute left-0 grid w-full"
              style={{ top: `${row.top * 100}%`, height: `${row.height * 100}%`, gridTemplateColumns: `repeat(${row.actions.length}, minmax(0, 1fr))` }}
            >
              {row.actions.map((action) => {
                const value = formatValue(stats[action]);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onAction?.(action)}
                    aria-label={LABELS[action]}
                    className="relative rounded-xl transition-colors active:bg-white/10"
                  >
                    {row.valueStyle && value && (
                      <span
                        className={`absolute left-1/2 max-w-full -translate-x-1/2 overflow-hidden px-1 text-center ${row.valueStyle === 'nav' ? 'bottom-[4%]' : 'bottom-[9%]'} ${VALUE_CLASS[row.valueStyle]} whitespace-nowrap`}
                      >
                        {value}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}