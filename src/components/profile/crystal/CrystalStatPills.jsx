import { Gem, Heart, Shield } from 'lucide-react';

const PILL = 'flex h-[27px] items-center justify-center gap-1 rounded-full border px-[7px] text-[10.5px] font-black tabular-nums text-white';

/**
 * Referanstaki üç kristal kapsül: solda mavi gradyanlı kalp, ortada altın tonlu kalkan,
 * sağda mor gradyanlı elmas. Değerler gerçek veriden gelir.
 */
export default function CrystalStatPills({ likes = 0, nLevel = 0, vipLevel = 0 }) {
  const stats = [
    {
      key: 'heart',
      icon: Heart,
      value: Number(likes || 0),
      color: '#ffffff',
      fill: '#ff6b95',
      border: 'rgba(120,190,255,0.85)',
      bg: 'linear-gradient(180deg, rgba(46,124,214,0.95) 0%, rgba(9,32,66,0.98) 100%)',
      glow: 'rgba(90,178,255,0.75)',
      title: 'Beğeni',
    },
    {
      key: 'n',
      icon: Shield,
      value: `N${nLevel}`,
      color: '#ffe9b0',
      fill: 'rgba(255,233,176,0.35)',
      border: 'rgba(244,221,164,0.9)',
      bg: 'linear-gradient(180deg, rgba(138,106,36,0.92) 0%, rgba(35,26,8,0.98) 100%)',
      glow: 'rgba(244,221,164,0.7)',
      title: 'N seviyesi',
    },
    {
      key: 'vip',
      icon: Gem,
      value: `VIP${vipLevel}`,
      color: '#ffffff',
      fill: 'rgba(216,180,254,0.4)',
      border: 'rgba(196,150,255,0.9)',
      bg: 'linear-gradient(180deg, rgba(112,62,190,0.95) 0%, rgba(30,12,58,0.98) 100%)',
      glow: 'rgba(178,120,255,0.75)',
      title: 'VIP seviyesi',
    },
  ];

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {stats.map(({ key, icon: Icon, value, color, fill, border, bg, glow, title }) => (
        <span
          key={key}
          title={title}
          className={PILL}
          style={{
            borderColor: border,
            background: bg,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 14px -6px ${glow}, 0 0 14px -6px ${glow}`,
          }}
        >
          <Icon className="h-[12px] w-[12px] shrink-0" strokeWidth={2.2} fill={fill} style={{ color }} />
          <span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  );
}