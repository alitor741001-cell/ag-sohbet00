import {
  Ban, Briefcase, Building2, ChevronRight, Coins, Crown, Eye, Gem, Gift,
  LayoutDashboard, Settings, Shield, ShoppingBag, Trophy, UserPlus, Users, UsersRound,
} from 'lucide-react';

// Profil menüsü: gruplanmış sade satırlar — simge, etiket, değer ve ok.
const GROUPS = [
  {
    title: 'Sosyal',
    items: [
      { key: 'friends', label: 'Arkadaşlar', icon: Users, tone: 'text-sky-400' },
      { key: 'following', label: 'Takip Edilenler', icon: UserPlus, tone: 'text-sky-400' },
      { key: 'followers', label: 'Takipçiler', icon: UsersRound, tone: 'text-sky-400' },
      { key: 'visitors', label: 'Ziyaretçiler', icon: Eye, tone: 'text-violet-400' },
    ],
  },
  {
    title: 'Cüzdan',
    items: [
      { key: 'coins', label: 'Coins', icon: Coins, tone: 'text-amber-400' },
      { key: 'diamonds', label: 'Elmaslar', icon: Gem, tone: 'text-cyan-400' },
      { key: 'vip', label: 'VIP Üyelik', icon: Crown, tone: 'text-yellow-400' },
      { key: 'giftHistory', label: 'Hediye Geçmişi', icon: Gift, tone: 'text-pink-400' },
    ],
  },
  {
    title: 'Mağaza ve Seviye',
    items: [
      { key: 'store', label: 'Alışveriş Merkezi', icon: ShoppingBag, tone: 'text-orange-400' },
      { key: 'bag', label: 'Çanta', icon: Briefcase, tone: 'text-teal-400' },
      { key: 'level', label: 'Seviye', icon: Trophy, tone: 'text-amber-400' },
      { key: 'agency', label: 'Ajans', icon: Building2, tone: 'text-indigo-400' },
    ],
  },
  {
    title: 'Hesap',
    items: [
      { key: 'admin', label: 'Yönetici Paneli', icon: LayoutDashboard, tone: 'text-red-400', adminOnly: true },
      { key: 'blocked', label: 'Engellenen Hesaplar', icon: Ban, tone: 'text-white/60' },
      { key: 'privacy', label: 'Gizlilik Politikası', icon: Shield, tone: 'text-white/60' },
      { key: 'settings', label: 'Ayarlar', icon: Settings, tone: 'text-white/60' },
    ],
  },
];

const formatValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toLocaleString('tr-TR');
  return String(value);
};

/**
 * Profil menüsü: dört grup, her grup tek kart içinde satırlar hâlinde.
 * Sayaçlar ve bakiyeler satırın sağında görünür; liste kaydırılabilir.
 */
export default function ProfileMenuDeck({ admin = false, onAction, stats = {} }) {
  return (
    <div className="no-scrollbar flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 py-2">
      {GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || admin);
        if (!items.length) return null;
        return (
          <div key={group.title} className="overflow-hidden rounded-2xl border border-border bg-card">
            <p className="px-3.5 pb-1 pt-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{group.title}</p>
            <div className="divide-y divide-border/70">
              {items.map(({ key, label, icon: Icon, tone }) => {
                const value = formatValue(stats[key]);
                const unread = key === 'visitors' ? stats.visitors_unread || 0 : 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onAction?.(key)}
                    aria-label={label}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left active:bg-white/5"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/90">{label}</span>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                    {value && <span className="shrink-0 text-[12px] font-black tabular-nums text-white/70">{value}</span>}
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}