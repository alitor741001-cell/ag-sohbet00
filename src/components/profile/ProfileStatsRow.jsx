import { Heart, Shield, Star } from 'lucide-react';
import { receivedColor, vipStyle } from '@/lib/userLevels';

/** Rozet sırası: oda seviyesi (LVL), hediye alış seviyesi (kalp) ve N seviyesi. VIP varsa eklenir. */
export default function ProfileStatsRow({ palette, level, receivedLevel, receivedTier, nLevel, vipLevel }) {
  const badges = [
    level > 0 && { key: 'lvl', icon: <Star className="h-4 w-4" fill="currentColor" />, label: `LVL ${level}`, border: palette.accent2, color: palette.accent2 },
    receivedLevel > 0 && { key: 'heart', icon: <Heart className="h-4 w-4" fill="currentColor" />, label: String(receivedLevel), background: receivedColor(receivedTier), border: palette.accent, color: '#fff' },
    nLevel > 0 && { key: 'n', icon: <Shield className="h-4 w-4" fill="currentColor" />, label: `N${nLevel}`, border: palette.accent2, color: palette.accent2 },
    vipLevel > 0 && { key: 'vip', label: `VIP${vipLevel}`, ...vipStyle(vipLevel) },
  ].filter(Boolean);

  if (!badges.length) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-black tabular-nums"
          style={{ background: badge.background || 'rgba(0,0,0,0.45)', borderColor: badge.border, color: badge.color, boxShadow: `0 0 14px -2px ${palette.glow}` }}
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  );
}