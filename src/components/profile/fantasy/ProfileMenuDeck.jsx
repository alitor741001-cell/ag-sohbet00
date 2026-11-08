import {
  Users, UserPlus, UserCheck, Eye, Coins, Gem, Crown, Gift,
  ShoppingBag, Trophy, Castle, Store, Settings, UserX, ShieldCheck, LayoutGrid,
} from 'lucide-react';
import ProfileMenuTile from '@/components/profile/ProfileMenuTile';

// Profil menüsü: 4x4 ızgara, cam yüzeyli renkli düğmeler (eski görsel tasarım kaldırıldı).
const ROWS = [
  [
    { key: 'friends', label: 'Arkadaşlar', Icon: Users, tone: 'sky' },
    { key: 'following', label: 'Takip Edilenler', Icon: UserPlus, tone: 'violet' },
    { key: 'followers', label: 'Takipçiler', Icon: UserCheck, tone: 'pink' },
    { key: 'visitors', label: 'Ziyaretçiler', Icon: Eye, tone: 'cyan' },
  ],
  [
    { key: 'coins', label: 'Coins', Icon: Coins, tone: 'amber' },
    { key: 'diamonds', label: 'Elmaslar', Icon: Gem, tone: 'cyan' },
    { key: 'vip', label: 'VIP', Icon: Crown, tone: 'rose' },
    { key: 'giftHistory', label: 'Hediye Geçmişi', Icon: Gift, tone: 'purple' },
  ],
  [
    { key: 'bag', label: 'Çanta', Icon: ShoppingBag, tone: 'emerald' },
    { key: 'level', label: 'Seviye', Icon: Trophy, tone: 'amber' },
    { key: 'agency', label: 'Ajans', Icon: Castle, tone: 'indigo' },
    { key: 'store', label: 'Alışveriş Merkezi', Icon: Store, tone: 'teal' },
  ],
  [
    { key: 'admin', label: 'Yönetici Paneli', Icon: LayoutGrid, tone: 'slate', adminOnly: true },
    { key: 'blocked', label: 'Engellenen Hesaplar', Icon: UserX, tone: 'red' },
    { key: 'privacy', label: 'Gizlilik Politikası', Icon: ShieldCheck, tone: 'blue' },
    { key: 'settings', label: 'Ayarlar', Icon: Settings, tone: 'zinc' },
  ],
];

/**
 * Profil menüsü: satırlar mevcut yüksekliği eşit paylaşır, düğmeler her telefonda
 * güvenli alanın içinde kalır ve ekran genişliğine göre ölçeklenir.
 */
export default function ProfileMenuDeck({ admin = false, onAction, stats = {} }) {
  return (
    <div className="grid min-h-0 w-full flex-1 grid-rows-4 gap-1.5 px-0.5 py-1">
      {ROWS.map((row) => (
        <div key={row.map((item) => item.key).join('-')} className="grid min-h-0 grid-cols-4 gap-1.5">
          {row.map(({ key, label, Icon, tone, adminOnly }) => (
            adminOnly && !admin
              ? <div key={key} aria-hidden="true" />
              : (
                <ProfileMenuTile
                  key={key}
                  label={label}
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