import { ChevronRight, Heart, Shield, Star } from 'lucide-react';
import { receivedColor } from '@/lib/userLevels';

const SLOT = 'flex h-[26px] min-w-0 flex-1 items-center justify-center gap-1 rounded-[7px] border px-1 text-[10px] font-black tabular-nums';

/**
 * Kompakt kartın "Rozetler:" kutusu: dört eşit yuva, dolular rozet rengiyle parlar,
 * boş yuvalar buz mavisi çerçeveyle bekler. Sağdaki ok kartın ayrıntılarına geçer.
 */
export default function CompactBadgeBoard({
  palette, level = 0, nLevel = 0, receivedLevel = 0, receivedTier, expanded = false, onToggle,
}) {
  const badges = [
    level > 0 ? {
      key: 'lvl',
      node: (<span className={SLOT} style={{ borderColor: palette.accent2, color: palette.accent2, background: 'rgba(8,26,44,0.85)' }}>
        <Star className="h-3 w-3" fill="currentColor" /> {level}
      </span>),
    } : null,
    nLevel > 0 ? {
      key: 'n',
      node: (<span className={SLOT} style={{ borderColor: '#cfd8dc', color: '#fff', background: '#4b664d' }}>
        <Shield className="h-3 w-3" fill="currentColor" /> {nLevel}
      </span>),
    } : null,
    receivedLevel > 0 ? {
      key: 'gift',
      node: (<span className={SLOT + ' text-white'} style={{ borderColor: palette.accent, background: receivedColor(receivedTier) }}>
        <Heart className="h-3 w-3" fill="currentColor" /> {receivedLevel}
      </span>),
    } : null,
  ].filter(Boolean);

  const slots = [0, 1, 2, 3].map((index) => badges[index] || null);

  return (
    <div
      className="mt-2 flex w-full items-center gap-1.5 rounded-xl border px-2 py-1.5"
      style={{ borderColor: 'rgba(127,182,221,0.55)', background: 'rgba(13,43,69,0.62)', boxShadow: 'inset 0 0 14px -8px #a8d8f5' }}
    >
      <span className="shrink-0 text-[9px] font-bold text-[#9fc7e6]">Rozetler:</span>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {slots.map((badge, index) => (badge ? (
          <span key={badge.key} className="flex min-w-0 flex-1">{badge.node}</span>
        ) : (
          <span
            key={`empty-${index}`}
            className="h-[26px] min-w-0 flex-1 rounded-[7px] border"
            style={{ borderColor: 'rgba(127,182,221,0.35)', background: 'rgba(9,24,40,0.65)' }}
          />
        )))}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Rozet ayrıntıları"
        aria-expanded={expanded}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[#cfeaff] active:scale-95"
        style={{ borderColor: 'rgba(168,216,245,0.6)' }}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
}