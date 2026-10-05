import { Gem, PartyPopper, TrendingUp } from 'lucide-react';
import { formatDiamonds, formatMoney, formatShortDiamonds, quotaPercent } from '@/lib/agency';

/** Yayıncının bu ayki elması ve bir sonraki kota kademesine kalan mesafe. */
export default function QuotaProgressCard({ month = 0, total = 0, nextTier = null, tiers = [] }) {
  const target = Number(nextTier?.diamonds) || 0;
  const percent = quotaPercent(month, target);
  const remaining = Math.max(0, target - month);
  // Tamamlanma yalnızca en üst kademeye gerçekten ulaşıldığında gösterilir:
  // kademe listesi gelmediğinde/boşken tebrik mesajı yanlış çıkmaz.
  const topDiamonds = (tiers || [])
    .filter((tier) => tier.active !== false)
    .reduce((max, tier) => Math.max(max, Number(tier.diamonds) || 0), 0);
  const done = topDiamonds > 0 && Number(month) >= topDiamonds;

  return (
    <div className="rounded-2xl border border-[#F5C542]/35 bg-gradient-to-br from-[#1d1505] via-[#0d0b16] to-[#140a1e] p-4 shadow-[0_0_30px_-14px_rgba(245,197,66,0.9)]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: '#F5C542' }}>
          <TrendingUp className="h-3.5 w-3.5" /> Bu Ayki Kotam
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/60">
          Toplam {formatShortDiamonds(total)} elmas
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Gem className="mb-1 h-6 w-6" style={{ color: '#5AB8FF' }} />
        <span className="text-3xl font-black leading-none text-white">{formatDiamonds(month)}</span>
        <span className="mb-1 text-xs font-semibold text-white/50">elmas</span>
      </div>

      {done ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#4ade80]/40 bg-[#4ade80]/10 px-3 py-2.5">
          <PartyPopper className="h-4 w-4 text-[#4ade80]" />
          <p className="text-xs font-bold text-[#4ade80]">🎉 Tüm kotalar tamamlandı — tebrikler!</p>
        </div>
      ) : target <= 0 ? (
        <p className="mt-3 text-[11px] text-white/45">Kota kademesi tanımlı değil.</p>
      ) : (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            <span>Sonraki kota: {formatShortDiamonds(target)}</span>
            <span style={{ color: '#F5C542' }}>{formatMoney(nextTier?.broadcaster_dollars)}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/60">
            <div className="h-full rounded-full bg-gradient-to-r from-[#5AB8FF] via-[#C084FC] to-[#F5C542] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-white/45">{formatShortDiamonds(remaining)} elmas kaldı</span>
            <span className="font-bold text-white/70">{percent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}