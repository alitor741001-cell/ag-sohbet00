import { Banknote, Calendar, Gem, Mic2, TrendingUp, Users } from 'lucide-react';
import { formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Ajans özet kartları: kazanç, elmas ve yayıncı sayıları. */
export default function AgencyStatsGrid({ agency = {} }) {
  const cards = [
    { key: 'total', label: 'Toplam Ajans Kazancı', value: formatMoney(agency.total_earnings || 0), icon: Banknote, tone: 'text-[#F5C542]' },
    { key: 'today', label: 'Bugünkü Kazanç', value: formatMoney(agency.today_earnings || 0), icon: TrendingUp, tone: 'text-[#4ade80]' },
    { key: 'month', label: 'Bu Ayki Kazanç', value: formatMoney(agency.month_earnings || 0), icon: Calendar, tone: 'text-[#C084FC]' },
    { key: 'diamonds', label: 'Toplam Elmas', value: formatShortDiamonds(agency.total_diamonds || 0), icon: Gem, tone: 'text-[#5AB8FF]' },
    { key: 'month_diamonds', label: 'Bu Ayki Elmas', value: formatShortDiamonds(agency.month_diamonds || 0), icon: Gem, tone: 'text-[#5AB8FF]' },
    { key: 'members', label: 'Toplam Yayıncı', value: agency.member_count || 0, icon: Users, tone: 'text-white' },
    { key: 'active', label: 'Aktif Yayıncı', value: agency.active_count || 0, icon: Mic2, tone: 'text-[#4ade80]' },
    { key: 'commission', label: 'Komisyon / 200K', value: `$${agency.commission_per_200k || 3}`, icon: Banknote, tone: 'text-[#F5C542]' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div key={card.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-1.5">
            <card.icon className={`h-3.5 w-3.5 ${card.tone}`} />
            <p className="text-[10px] uppercase tracking-wider text-white/45">{card.label}</p>
          </div>
          <p className={`mt-1 text-base font-black ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}