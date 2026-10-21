import { Gem, Heart, Shield } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

const PILL = 'flex h-[26px] items-center justify-center gap-1 rounded-full border px-[6px] text-[10.5px] font-black tabular-nums text-white';

/** Referanstaki üç kristal kapsül: beğeni (kalp), N seviyesi ve VIP. */
export default function CrystalStatPills({ likes = 0, nLevel = 0, vipLevel = 0, tone = 'blue' }) {
  const c = crystalSkin(tone);

  const stats = [
    { key: 'heart', icon: Heart, value: Number(likes || 0), color: c.heart, fill: c.heart, title: 'Beğeni' },
    { key: 'n', icon: Shield, value: `N${nLevel}`, color: '#9ad3a6', title: 'N seviyesi' },
    { key: 'vip', icon: Gem, value: `VIP${vipLevel}`, color: c.gold, title: 'VIP seviyesi' },
  ];

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {stats.map(({ key, icon: Icon, value, color, fill, title }) => (
        <span
          key={key}
          title={title}
          className={PILL}
          style={{
            borderColor: c.edge,
            background: c.glass,
            boxShadow: `inset 0 0 0 1px ${c.blueEdge}, inset 0 0 14px -7px ${c.glow}, 0 0 12px -8px ${c.glow}`,
          }}
        >
          <Icon className="h-[12px] w-[12px] shrink-0" strokeWidth={2.2} fill={fill || 'none'} style={{ color }} />
          <span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  );
}