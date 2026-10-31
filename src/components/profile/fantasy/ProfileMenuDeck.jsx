import useCutoutSprites from '@/hooks/useCutoutSprites';

// Dört satır, her satırda dört düğme: tasarımlar gönderilen sırayla alt alta durur.
const GROUPS = [
  { url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1ecd0918b_IMG_0528.jpg', actions: ['friends', 'following', 'followers', 'visitors'] },
  { url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/70ce294b8_IMG_0529.jpg', actions: ['coins', 'diamonds', 'vip', 'giftHistory'], amount: ['coins', 'diamonds'] },
  { url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/ccb2e081e_IMG_0530.jpg', actions: ['store', 'bag', 'level', 'agency'] },
  { url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/56b5f2183_IMG_0531.jpg', actions: ['admin', 'blocked', 'privacy', 'settings'], adminFirst: true },
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

const ROW_HEIGHT = 'clamp(52px, 15.5vw, 76px)';

function formatValue(value, amount = false) {
  if (value === null || value === undefined) return '';
  const numeric = Number(value);
  if (amount && Math.abs(numeric) >= 1_000_000) {
    const unit = Math.abs(numeric) >= 1_000_000_000_000
      ? { divisor: 1_000_000_000_000, label: 'Tn' }
      : Math.abs(numeric) >= 1_000_000_000
        ? { divisor: 1_000_000_000, label: 'Mr' }
        : { divisor: 1_000_000, label: 'Mn' };
    return `${(numeric / unit.divisor).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit.label}`;
  }
  return numeric.toLocaleString('tr-TR', amount
    ? { minimumIntegerDigits: 6, useGrouping: false }
    : undefined);
}

/**
 * Profil menüsü: gönderilen tasarımlar dört satır olarak alt alta dizilir.
 * Her düğme kendi şeffaf PNG parçasıdır; satırlar ekran kenarından kenarına uzanır.
 */
export default function ProfileMenuDeck({ admin = false, stats = {}, onAction }) {
  const spriteRows = [
    useCutoutSprites(GROUPS[0].url, 4),
    useCutoutSprites(GROUPS[1].url, 4),
    useCutoutSprites(GROUPS[2].url, 4),
    useCutoutSprites(GROUPS[3].url, 4),
  ];

  return (
    <div className="-mx-4 flex min-h-0 w-[calc(100%+2rem)] flex-1 flex-col justify-center gap-1">
      {GROUPS.map((group, rowIndex) => {
        // Yönetici olmayan üyede ilk düğme (Yönetici Paneli) gösterilmez.
        const skip = group.adminFirst && !admin ? 1 : 0;
        const actions = group.actions.slice(skip);
        const sprites = spriteRows[rowIndex];
        return (
          <div
            key={group.url}
            className="grid w-full items-center"
            style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))`, height: ROW_HEIGHT }}
          >
            {actions.map((action, index) => {
              const sprite = sprites[skip + index];
              const amount = group.amount?.includes(action);
              const value = formatValue(stats[action], amount);
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => onAction?.(action)}
                  aria-label={LABELS[action]}
                  className="relative flex h-full w-full items-center justify-center transition-transform active:scale-95"
                >
                  {sprite ? (
                    <img src={sprite.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain" />
                  ) : null}
                  {value && (
                    <span className="pointer-events-none absolute right-1 top-0 rounded-full bg-black/70 px-1.5 text-[10px] font-extrabold tabular-nums text-amber-100 ring-1 ring-amber-300/40">
                      {value}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}