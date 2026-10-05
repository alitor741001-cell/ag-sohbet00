import { Gem, Mic2, TrendingUp, Wallet } from 'lucide-react';
import { Image } from '@/components/ui/image';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import { formatMoney, formatShortDiamonds, tierStyle } from '@/lib/agency';

/** Ajansın bu ayki kota kazançları: kademe komisyonları ve yayıncı bazlı kotalar. */
export default function AgencyQuotaBoard({ members = [], tiers = [], monthDiamonds = 0, monthEarnings = 0 }) {
  const ranked = [...members].sort((a, b) => (Number(b.month_commission) || 0) - (Number(a.month_commission) || 0));
  const quotaTotal = members.reduce((sum, member) => sum + (Number(member.quota) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#F5C542]/35 bg-gradient-to-br from-[#1d1505] via-[#0d0b16] to-[#140a1e] p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: '#F5C542' }}>
          <TrendingUp className="h-3.5 w-3.5" /> Bu Ayki Kota Kazançları
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Kota elması</p>
            <p className="flex items-center justify-center gap-1 text-xs font-black text-white"><Gem className="h-3 w-3 text-[#5AB8FF]" />{formatShortDiamonds(monthDiamonds)}</p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Tamamlanan kota</p>
            <p className="text-xs font-black text-[#4ade80]">{quotaTotal ? `${formatShortDiamonds(quotaTotal)} ✓` : '—'}</p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Bu ayki kazanç</p>
            <p className="text-xs font-black" style={{ color: '#F5C542' }}>{formatMoney(monthEarnings)}</p>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/60">
        <Wallet className="h-3.5 w-3.5" style={{ color: '#F5C542' }} /> Kota Kademeleri (Ajans Komisyonu)
      </p>
      <QuotaTierGrid tiers={tiers} monthDiamonds={monthDiamonds} amountField="agency_dollars" amountLabel="ajans komisyonu" />

      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/60">
        <Mic2 className="h-3.5 w-3.5 text-[#5AB8FF]" /> Yayıncı Kotaları
      </p>
      {ranked.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 py-6 text-center text-xs text-white/50">Ajansta henüz yayıncı yok.</p>
      ) : (
        <div className="space-y-2">
          {ranked.map((member) => {
            const style = tierStyle(member.quota);
            return (
              <div key={member.user_id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/50">
                    {member.avatar
                      ? <Image src={member.avatar} className="h-full w-full object-cover" fittingType="fill" />
                      : <span className="text-xs font-bold">{(member.name || 'Y')[0]}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{member.name}</p>
                    <p className="truncate text-[10px] text-white/40">Bu ayki elmas: {formatShortDiamonds(member.diamonds)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${member.quota ? `${style.border} ${style.text}` : 'border-white/20 text-white/40'}`}>
                    {member.quota ? `${formatShortDiamonds(member.quota)} kota ✓` : 'Kota yok'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                  <span>Bu ayki ajans komisyonu</span>
                  <span className="font-black" style={{ color: '#F5C542' }}>{formatMoney(member.month_commission || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}