import {
  Users, UserPlus, UserCheck, Eye, Coins, Gem, Crown, Gift,
  ShoppingBag, Trophy, Castle, Settings, UserX, ShieldCheck, LayoutGrid,
} from 'lucide-react';
import ProfileMenuTile from '@/components/profile/ProfileMenuTile';

// Profil menüsü: cam yüzeyli neon düğmeler. Her satır kendi sütun sayısını taşır.
const ROWS = [
  {
    cols: 4,
    items: [
      { key: 'friends', label: 'Arkadaşlar', Icon: Users, tone: 'sky' },
      { key: 'following', label: 'Takip Edilenler', Icon: UserPlus, tone: 'violet' },
      { key: 'followers', label: 'Takipçiler', Icon: UserCheck, tone: 'pink' },
      { key: 'visitors', label: 'Ziyaretçiler', Icon: Eye, tone: 'cyan' },
    ],
  },
  {
    cols: 4,
    items: [
      { key: 'coins', label: 'Coins', Icon: Coins, tone: 'amber' },
      { key: 'diamonds', label: 'Elmaslar', Icon: Gem, tone: 'cyan' },
      { key: 'vip', label: 'VIP', Icon: Crown, tone: 'rose' },
      { key: 'giftHistory', label: 'Hediye Geçmişi', Icon: Gift, tone: 'purple' },
    ],
  },
  {
    cols: 3,
    items: [
      { key: 'bag', label: 'Çanta', Icon: ShoppingBag, tone: 'emerald' },
      { key: 'level', label: 'Seviye', Icon: Trophy, tone: 'amber' },
      { key: 'agency', label: 'Ajans', Icon: Castle, tone: 'indigo' },
    ],
  },
  {
    cols: 4,
    items: [
      { key: 'admin', label: 'Yönetici Paneli', Icon: LayoutGrid, tone: 'slate', adminOnly: true },
      { key: 'blocked', label: 'Engellenen Hesaplar', Icon: UserX, tone: 'red' },
      { key: 'privacy', label: 'Gizlilik Politikası', Icon: ShieldCheck, tone: 'blue' },
      { key: 'settings', label: 'Ayarlar', Icon: Settings, tone: 'zinc' },
    ],
  },
];

const COLS = { 3: 'grid-cols-3', 4: 'grid-cols-4' };

/**
 * Profil menüsü: satırlar mevcut yüksekliği eşit paylaşır, düğmeler her telefonda
 * güvenli alanın içinde kalır ve ekran genişliğine göre ölçeklenir.
 */
export default function ProfileMenuDeck({ admin = false, onAction, stats = {} }) {
  return (
    // Düğmeler sabit, kompakt yükseklikte durur; alan daralırsa liste kendi içinde kayar,
    // hiçbir düğme alt menü çubuğunun altına ya da üstüne girmez.
    <div className="no-scrollbar mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col justify-start gap-2 overflow-y-auto px-2.5 pb-3 pt-3">
      {ROWS.map((row) => (
        <div key={row.items.map((item) => item.key).join('-')} className={`grid shrink-0 gap-2 ${COLS[row.cols]}`}>
          {row.items.map(({ key, label, Icon, tone, adminOnly }) => (
            adminOnly && !admin
              ? <span key={key} aria-hidden="true" />
              : (
                <ProfileMenuTile
                  key={key}
                  label={label}
                  artworkKey={key}
                  Icon={Icon}
                  tone={tone}
                  value={stats[key]}
                  unread={key === 'visitors' ? stats.visitors_unread : 0}
                  onClick={() => onAction?.(key)}
                />
              )
          ))}
        </div>
      ))}
    </div>
  );
}