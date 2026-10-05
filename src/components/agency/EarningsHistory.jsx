import { BadgeCheck, Clock3, Gem, Wallet } from 'lucide-react';
import { dateText, formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Tamamlanan kota kazançları: tutar, durum ve işlem kaydı. */
export default function EarningsHistory({ rewards = [], totals = {} }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Bekleyen</p>
          <p className="text-sm font-black" style={{ color: '#F5C542' }}>{formatMoney(totals.pending || 0)}</p>
        </div>
        <div className="rounded-2xl border border-[#4ade80]/30 bg-white/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Ödenmiş</p>
          <p className="text-sm font-black text-[#4ade80]">{formatMoney(totals.paid || 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Toplam</p>
          <p className="text-sm font-black text-white">{formatMoney(totals.total || 0)}</p>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
          <Wallet className="h-7 w-7 text-white/30" />
          <p className="text-sm font-semibold text-white/60">Henüz kazanç yok</p>
          <p className="max-w-[240px] text-[11px] text-white/40">Kota tamamlandığında kazancın burada listelenir.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => (
            <div key={reward.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Gem className="h-3.5 w-3.5 text-[#5AB8FF]" />
                  <span className="text-sm font-black text-white">{formatShortDiamonds(reward.diamonds)}</span>
                  <span className="text-[10px] text-white/45">kota</span>
                </span>
                <span className="text-base font-black" style={{ color: reward.status === 'paid' ? '#4ade80' : '#F5C542' }}>
                  {formatMoney(reward.amount)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
                {reward.status === 'paid'
                  ? <span className="flex items-center gap-1 rounded-full border border-[#4ade80]/40 px-2 py-0.5 font-bold text-[#4ade80]"><BadgeCheck className="h-3 w-3" /> Ödendi</span>
                  : <span className="flex items-center gap-1 rounded-full border border-[#F5C542]/40 px-2 py-0.5 font-bold text-[#F5C542]"><Clock3 className="h-3 w-3" /> Bekliyor</span>}
                <span className="flex items-center gap-1">✓ Tamamlandı</span>
                {reward.completed_at && <span>{dateText(reward.completed_at)}</span>}
              </div>
              {reward.transaction_id && (
                <p className="mt-1.5 truncate text-[10px] text-white/30">İşlem no: {reward.transaction_id}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}