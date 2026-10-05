import { Gem } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/** Kota Tablosu: kademe kutuları ve bir sonraki kademeye ilerleme. */
export default function AgencyQuota() {
  const { role, agency, panel, broadcaster, loading } = useAgencyPageData();
  const isOwner = role === 'owner';
  const tiers = (isOwner ? panel?.tiers : broadcaster?.tiers) || [];
  const monthDiamonds = isOwner ? (panel?.agency?.month_diamonds || 0) : (broadcaster?.diamonds?.month || 0);
  const nextTier = isOwner
    ? (tiers.find((tier) => Number(tier.diamonds) > monthDiamonds) || null)
    : (broadcaster?.next_tier || null);

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
          amountField={isOwner ? 'agency_dollars' : 'broadcaster_dollars'}
          amountLabel={isOwner ? 'ajans komisyonu' : 'yayıncı kazancı'}
        />

        <p className="text-[10px] leading-relaxed text-white/40">
          {isOwner
            ? `Ajansın bu ay ${monthDiamonds.toLocaleString('tr-TR')} elmas kotaya ulaştı. Kademeler, yayıncıların tamamladığı kotalara göre belirlenir.`
            : 'Kademeler bu ayki elmas miktarına göre ilerler; tamamlanan her kademe kazancına eklenir.'}
        </p>
      </div>
    </AgencyPageShell>
  );
}