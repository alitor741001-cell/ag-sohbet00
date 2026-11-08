import {
  Ban, Briefcase, Building2, Coins, Crown, Eye, Gem, Gift,
  LayoutDashboard, Settings, Shield, ShoppingBag, Trophy, UserPlus, Users, UsersRound,
} from 'lucide-react';
import useCutoutRegions from '@/hooks/useCutoutRegions';
import ProfileSocialCount from '@/components/profile/social/ProfileSocialCount';

// Profil menüsü görseli: 4x4 eşit hücre. Her hücrenin beyaz zemini şeffaf yapılır,
// düğmeler şeffaf PNG olarak yüklenir — arkalarında beyaz kutu kalmaz.
const ART = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/ba865902d_profile_menu_grid.jpg';
const EDGE = [0, .25, .5, .75, 1];
const REGIONS = Array.from({ length: 16 }, (_, i) => ({
  x: EDGE[i % 4], y: EDGE[Math.floor(i / 4)], w: .25, h: .25,
}));
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
export default function ProfileMenuDeck({ admin = false, onAction, stats = {} }) {
  const images = useCutoutRegions(ART, REGIONS);
  return (
    <div className="grid min-h-0 w-full flex-1 grid-rows-4 gap-2 px-0 py-1">
      {ROWS.map((row, rowIndex) => (
        <div key={row.map((item) => item.key).join('-')} className="grid min-h-0 grid-cols-4 gap-1.5">
          {row.map(({ key, label, adminOnly }, colIndex) => (
            adminOnly && !admin ? <div key={key} aria-hidden="true" /> : (
              <button
                key={key}
                type="button"
                onClick={() => onAction?.(key)}
                aria-label={label}
                className="relative flex min-h-0 items-center justify-center transition active:scale-95"
              >
                {images[rowIndex * 4 + colIndex] && (
                  <img
                    src={images[rowIndex * 4 + colIndex]}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
                  />
                )}
                {rowIndex === 0 && <ProfileSocialCount value={stats[key]} unread={key === 'visitors' ? stats.visitors_unread : 0} />}
                <span className="sr-only">{label}</span>
              </button>
            )
          ))}
        </div>
      ))}
    </div>
  );
}