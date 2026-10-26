import { Heart, Shield, Star } from 'lucide-react';
import { N_BADGE_STYLE, SENT_BADGE_BACKGROUND, receivedColor } from '@/lib/userLevels';

/** Katman renkleri: her seviye katmanı kendi fantastik degradesiyle parlar. */
const TIER_GLOW = {
  green: '#34d399',
  dark: '#059669',
  purple: '#a855f7',
  blue: '#38bdf8',
  gold: '#facc15',
  red: '#f43f5e',
};

const HEART_GLOW = { ...TIER_GLOW, green: '#e58e46' };

/**
 * Profil kartında gönderilen hediye (yıldız), alınan hediye (kalp) ve N seviyesi.
 * Oda seviyesi profil kartlarında gösterilmez.
 */
export default function ProfileStatsRow({ level = 0, sentLevel = 0, sentTier = 'green', receivedLevel = 0, receivedTier = 'green', nLevel = 0 }) {
  const badges = [

    sentLevel > 0 && {
      key: 'sent',
      icon: <Star className="h-3 w-3" fill="currentColor" />,
      label: `ATIŞ ${sentLevel}`,
      background: SENT_BADGE_BACKGROUND,
      border: '#fde68a',
      color: '#20160a',
      glow: TIER_GLOW[sentTier] || TIER_GLOW.gold,
    },
    receivedLevel > 0 && {
      key: 'received',
      icon: <Heart className="h-3 w-3" fill="currentColor" />,
      label: `ALIŞ ${receivedLevel}`,
      background: `linear-gradient(135deg, ${receivedColor(receivedTier)}, ${HEART_GLOW[receivedTier] || '#b45309'})`,
      border: '#ffd9a8',
      color: '#fff',
      glow: HEART_GLOW[receivedTier] || '#e58e46',
    },
    nLevel > 0 && {
      key: 'n',
      icon: <Shield className="h-3 w-3" fill="currentColor" />,
      label: `N${nLevel}`,
      background: `linear-gradient(135deg, #34d399, ${N_BADGE_STYLE.background})`,
      border: N_BADGE_STYLE.border,
      color: '#fff',
      glow: '#34d399',
    },
  ].filter(Boolean);

  if (!badges.length) return null;

  return (
    <div className="level-ribbon flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-black/35 px-2 py-1.5">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className="flex items-center gap-1 rounded-full border px-2 py-[3px] text-[10px] font-black tabular-nums"
          style={{
            background: badge.background,
            borderColor: badge.border,
            color: badge.color,
            textShadow: badge.color === '#fff' ? '0 1px 2px rgba(0,0,0,.45)' : 'none',
            boxShadow: `0 0 12px -3px ${badge.glow}, inset 0 1px 0 rgba(255,255,255,.35)`,
          }}
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  );
}