import { CalendarDays, Gem, Wallet } from 'lucide-react';
import { formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Yayıncının bu ayki kota kazancı: tamamlanan kota, bu ayki elmas ve kazanç. */
export default function QuotaEarningsCard({ month = 0, period = '', nextTier = null, rewards = [], summary }) {
  const monthly = rewards.filter((reward) => reward.period === period);
  const completed = summary ? Number(summary.max_diamonds) || 0 : monthly.reduce((max, reward) => Math.max(max, Number(reward.diamonds) || 0), 0);
  const earned = summary ? Number(summary.sum_amount) || 0 : monthly.reduce((sum, reward) => sum + (Number(reward.amount) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#F5C542]/35 bg-gradient-to-br from-[#1d1505] via-[#0d0b16] to-[#140a1e] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: '#F5C542' }}>
            <CalendarDays className="h-3.5 w-3.5" /> Bu Ayki Kota Kazancın
          </span>
          {period && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/60">{period}</span>}
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-base font-black text-white">
          {completed > 0
            ? <><Gem className="h-4 w-4 text-[#5AB8FF]" />{formatShortDiamonds(completed)} kota tamamlandı ✓</>
            : 'Bu ay henüz kota tamamlanmadı'}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Bu ayki elmas</p>
            <p className="text-xs font-black text-white">{formatShortDiamonds(month)}</p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Kota kazancın</p>
            <p className="text-xs font-black text-[#4ade80]">{formatMoney(earned)}</p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Sonraki kota</p>
            <p className="text-xs font-black text-white">{nextTier ? formatShortDiamonds(nextTier.diamonds) : '—'}</p>
          </div>
        </div>

        <p className="mt-2 flex items-center gap-1 text-[10px] text-white/45">
          <Wallet className="h-3 w-3" /> Bu ay {summary?.count ?? monthly.length} tamamlanan kota
        </p>
      </div>
    </div>
  );
}