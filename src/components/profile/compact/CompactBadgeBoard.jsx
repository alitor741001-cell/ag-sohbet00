import { ChevronRight, Heart, Shield, Star } from 'lucide-react';
import { compactTone } from '@/components/profile/compact/compactTheme';
import { receivedColor } from '@/lib/userLevels';

const CELL = 'flex h-[26px] min-w-0 flex-1 items-center justify-center gap-[3px] rounded-[6px] border';

/**
 * Referanstaki "Rozetler:" kutusu: kristal kenarlı panel, dört eşit yuva ve her yuvanın
 * içinde açık halkalı bir rozet dairesi. Sağdaki ok kartın ek bilgilerini açar.
 */
export default function CompactBadgeBoard({
  tone = 'pink', level = 0, nLevel = 0, receivedLevel = 0, receivedTier, expanded = false, onToggle,
}) {
  const c = compactTone(tone);

  const badges = [
    level > 0 ? { key: 'lvl', icon: Star, value: level, color: c.mid } : null,
    nLevel > 0 ? { key: 'n', icon: Shield, value: nLevel, color: '#9ad3a6' } : null,
    receivedLevel > 0 ? { key: 'gift', icon: Heart, value: receivedLevel, color: receivedColor(receivedTier) } : null,
  ].filter(Boolean);

  return (
    <div
      className="mt-2 flex w-full items-center gap-1.5 rounded-[10px] border p-[3px]"
      style={{
        borderColor: c.edge,
        background: c.crystal,
        boxShadow: `0 0 18px -8px ${c.mid}`,
      }}
    >
      <div
        className="flex flex-1 items-center gap-1 rounded-[8px] border px-1.5 py-1"
        style={{ borderColor: c.edge, background: `linear-gradient(180deg, ${c.boardTop}, ${c.boardBottom})` }}
      >
        <span className="shrink-0 text-[9px] font-bold" style={{ color: c.label }}>Rozetler:</span>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {[0, 1, 2, 3].map((index) => {
            const badge = badges[index];
            return (
              <span
                key={badge?.key || `empty-${index}`}
                className={CELL}
                style={{ borderColor: c.boardEdge, background: 'rgba(255,255,255,0.06)' }}
              >
                <span
                  className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: c.slot, background: 'rgba(255,255,255,0.08)' }}
                >
                  {badge && <badge.icon className="h-[10px] w-[10px]" strokeWidth={2.4} style={{ color: badge.color }} />}
                </span>
                {badge && <span className="text-[8.5px] font-black leading-none text-white">{badge.value}</span>}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Rozet ayrıntıları"
          aria-expanded={expanded}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border active:scale-95"
          style={{ borderColor: c.slot, color: c.label }}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
}