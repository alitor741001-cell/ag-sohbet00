import {
  Ban, Briefcase, Building2, Coins, Crown, Eye, Gem, Gift,
  LayoutDashboard, Settings, Shield, ShoppingBag, Trophy, UserPlus, Users, UsersRound,
} from 'lucide-react';

// Profil menüsü: tasarım görselleri kaldırıldı. Düğmeler sade, standart
// arayüz düğmeleridir — ikon ve etiket, sade koyu yüzey üzerinde.
const ROWS = [
  [
    { key: 'friends', label: 'Arkadaşlar', icon: Users },
    { key: 'following', label: 'Takip Edilenler', icon: UserPlus },
    { key: 'followers', label: 'Takipçiler', icon: UsersRound },
    { key: 'visitors', label: 'Ziyaretçiler', icon: Eye },
  ],
  [
    { key: 'coins', label: 'Coins', icon: Coins },
    { key: 'diamonds', label: 'Elmaslar', icon: Gem },
    { key: 'vip', label: 'VIP', icon: Crown },
    { key: 'giftHistory', label: 'Hediye Geçmişi', icon: Gift },
  ],
  [
    { key: 'store', label: 'Alışveriş Merkezi', icon: ShoppingBag },
    { key: 'bag', label: 'Çanta', icon: Briefcase },
    { key: 'level', label: 'Seviye', icon: Trophy },
    { key: 'agency', label: 'Ajans', icon: Building2 },
  ],
  [
    { key: 'admin', label: 'Yönetici Paneli', icon: LayoutDashboard, adminOnly: true },
    { key: 'blocked', label: 'Engellenen Hesaplar', icon: Ban },
    { key: 'privacy', label: 'Gizlilik Politikası', icon: Shield },
    { key: 'settings', label: 'Ayarlar', icon: Settings },
  ],
];

/**
 * Profil menüsü: sade düğmeler dört satır, dört sütun ızgarada durur ve
 * çentik kenarlarına kadar yayılır. Satırlar mevcut yüksekliği eşit paylaşır.
 */
export default function ProfileMenuDeck({ admin = false, onAction }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-4 gap-1.5 px-2 py-1">
      {ROWS.map((row) => (
        <div key={row.map((item) => item.key).join('-')} className="grid min-h-0 grid-cols-4 gap-1.5">
          {row.map(({ key, label, icon: Icon, adminOnly }) => (
            adminOnly && !admin ? <div key={key} aria-hidden="true" /> : (
              <button
                key={key}
                type="button"
                onClick={() => onAction?.(key)}
                aria-label={label}
                className="flex min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-1 text-center transition active:scale-95 active:border-primary/60 active:bg-primary/15"
              >
                <Icon className="h-5 w-5 shrink-0 text-white/85" aria-hidden="true" />
                <span className="line-clamp-2 text-[9px] font-semibold leading-[1.15] text-white/80">{label}</span>
              </button>
            )
          ))}
        </div>
      ))}
    </div>
  );
}