import { Gem } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { formatMoney } from '@/lib/agency';

/** Kota Tablosu: yayıncı kendi ilerlemesini, ajans sahibi komisyon kademelerini görür. */
export default function AgencyQuota() {
  const { role, agency, panel, broadcaster, loading } = useAgencyPageData();
  const isOwner = role === 'owner';
  const tiers = (isOwner ? panel?.tiers : broadcaster?.tiers) || [];
  // Kotalar herkes için ayrı ilerler: sahibin tablosu komisyon kademelerini referans olarak gösterir,
  // yayıncının tablosu yalnızca kendi elmasına göre dolar.
  const monthDiamonds = isOwner ? 0 : (broadcaster?.diamonds?.month || 0);
  const nextTier = isOwner ? null : (broadcaster?.next_tier || null);

  return (
    <AgencyPageShell
      title="💎 Kota Tablosu"
      subtitle={isOwner ? 'Ajans komisyon kademeleri' : 'Kota kademeleri ve ilerlemen'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {!isOwner && (
          <QuotaProgressCard
            month={broadcaster?.diamonds?.month || 0}
            total={broadcaster?.diamonds?.total || 0}
            nextTier={nextTier}
          />
        )}

        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/60">
          <Gem className="h-3.5 w-3.5" style={{ color: '#F5C542' }} />
          {isOwner ? 'Kota Kademeleri (Ajans Komisyonu)' : 'Kota Kademeleri (Yayıncı Kazancı)'}
        </p>

        <QuotaTierGrid
          tiers={tiers}
          monthDiamonds={monthDiamonds}
          nextTier={nextTier}
          trackProgress={!isOwner}
          amountField={isOwner ? 'agency_dollars' : 'broadcaster_dollars'}
          amountLabel={isOwner ? 'ajans komisyonu' : 'yayıncı kazancı'}
        />

        <p className="text-[10px] leading-relaxed text-white/40">
          {isOwner
            ? `Her yayıncı kendi kotasını ayrı tamamlar; tamamlanan her kota için ajansına 200.000 elmas başına $${agency?.commission_per_200k || 3} komisyon işlenir. Bu ay işlenen komisyon: ${formatMoney(agency?.month_earnings || 0)}.`
            : 'Kademeler bu ayki elmas miktarına göre ilerler; tamamlanan her kademe kazancına eklenir.'}
        </p>
      </div>
    </AgencyPageShell>
  );
}