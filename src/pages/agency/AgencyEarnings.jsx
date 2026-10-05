import { Banknote } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyStatsGrid from '@/components/agency/AgencyStatsGrid';
import QuotaEarningsCard from '@/components/agency/QuotaEarningsCard';
import EarningsHistory from '@/components/agency/EarningsHistory';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { AGENCY_GOLD, formatMoney } from '@/lib/agency';

/** Kazançlarım: ajans sahibi için ajans kazançları, yayıncı için kota kazanç geçmişi. */
export default function AgencyEarnings() {
  const { role, agency, panel, broadcaster, loading } = useAgencyPageData();
  const isOwner = role === 'owner';

  return (
    <AgencyPageShell
      title="💰 Kazançlarım"
      subtitle={agency?.name ? `${agency.name}${agency.agency_id ? ` • ${agency.agency_id}` : ''}` : ''}
      sections={agencySections(role)}
      loading={loading}
    >
      {isOwner ? (
        <div className="space-y-3">
          <AgencyStatsGrid agency={panel?.agency || agency || {}} />
          <div className="rounded-2xl border border-[#F5C542]/25 bg-[#F5C542]/5 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>
              <Banknote className="h-3.5 w-3.5" /> Komisyon Sistemi
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              Yayıncıların tamamladığı her kota için ajansına 200.000 elmas başına
              <span className="font-bold text-white"> ${agency?.commission_per_200k || 3}</span> komisyon işlenir.
              Bu ayki toplam komisyonun: <span className="font-bold" style={{ color: AGENCY_GOLD }}>{formatMoney(agency?.month_earnings || 0)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <QuotaEarningsCard
            month={broadcaster?.diamonds?.month || 0}
            period={broadcaster?.period || ''}
            nextTier={broadcaster?.next_tier}
            rewards={broadcaster?.rewards || []}
          />
          <EarningsHistory rewards={broadcaster?.rewards || []} totals={broadcaster?.totals || {}} />
        </div>
      )}
    </AgencyPageShell>
  );
}