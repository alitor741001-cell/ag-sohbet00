import { Gem } from 'lucide-react';
import { formatMoney, formatShortDiamonds, tierStyle } from '@/lib/agency';

/**
 * Kota tablosu kartları: her kademe için gereken elmas ve kazanç.
 * trackProgress=false iken ilerleme/tamamlanma işaretleri gösterilmez (komisyon kademeleri referansı).
 */
export default function QuotaTierGrid({ tiers = [], monthDiamonds = 0, nextTier = null, limit = 0, amountField = 'broadcaster_dollars', amountLabel = 'yayıncı kazancı', trackProgress = true }) {
  const list = limit > 0 ? tiers.slice(0, limit) : tiers;
  if (!list.length) return <p className="py-8 text-center text-xs text-white/45">Kota tablosu henüz tanımlı değil.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {list.map((tier) => {
        const style = tierStyle(tier.diamonds);
        const done = trackProgress && monthDiamonds >= Number(tier.diamonds);
        const isNext = trackProgress && nextTier && nextTier.id === tier.id;
        const percent = isNext ? Math.min(100, Math.round((monthDiamonds / Number(tier.diamonds)) * 100)) : null;
        return (
          <div key={tier.id} className={`rounded-2xl border ${style.border} ${style.bg} p-3 ${done ? 'ring-1 ring-[#4ade80]/40' : ''}`}>
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">
                <Gem className={`h-3.5 w-3.5 ${style.text}`} />
                <span className={`text-sm font-black ${style.text}`}>{formatShortDiamonds(tier.diamonds)}</span>
              </span>
              <span className={`text-[9px] font-bold ${style.text}`}>{style.label}</span>
            </div>
            <p className="mt-1 text-base font-black text-white">{formatMoney(tier[amountField])}</p>
            <p className="text-[10px] text-white/45">{amountLabel}</p>
            {done && <p className="mt-1 text-[10px] font-bold text-[#4ade80]">✓ Tamamlandı</p>}
            {!done && isNext && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#5AB8FF] to-[#C084FC]" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-white/50">{percent}% • {formatShortDiamonds(Math.max(0, Number(tier.diamonds) - monthDiamonds))} kaldı</p>
              </div>
            )}
            {trackProgress && !done && !isNext && (
              <p className="mt-1 text-[10px] text-white/35">{formatShortDiamonds(Math.max(0, Number(tier.diamonds) - monthDiamonds))} kaldı</p>
            )}
          </div>
        );
      })}
    </div>
  );
}