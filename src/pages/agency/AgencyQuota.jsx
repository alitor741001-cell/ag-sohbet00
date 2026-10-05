import { Gem } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { formatMoney } from '@/lib/agency';

/**
 * Kota Tablosu: yayıncı kendi ilerlemesini, ajans sahibi hem yayıncı kazancını
 * hem ajans komisyonunu, asistan ise payına esas komisyon kademelerini görür.
 */
export default function AgencyQuota() {
  const { role, agency, panel, broadcaster, assistant, loading } = useAgencyPageData();
  const isOwner = role === 'owner';
  const isAssistant = role === 'assistant';
  const tiers = (isOwner ? panel?.tiers : broadcaster?.tiers) || [];
  // Kotalar herkes için ayrı ilerler: sahibin tablosu yayıncı + komisyon kademelerini gösterir,
  // yayıncının tablosu yalnızca kendi elmasına göre dolar.
  const monthDiamonds = isOwner ? 0 : (broadcaster?.diamonds?.month || 0);
  const nextTier = isOwner || isAssistant ? null : (broadcaster?.next_tier || null);
  const share = Number(assistant?.assistant?.share) || 0;

  return (
    <AgencyPageShell
      title="💎 Kota Tablosu"
      subtitle={isOwner ? 'Yayıncı kazancı ve ajans komisyonu' : isAssistant ? `Asistan payı %${share}` : 'Kota kademeleri ve ilerlemen'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {role === 'broadcaster' && (
          <QuotaProgressCard
            month={broadcaster?.diamonds?.month || 0}
            total={broadcaster?.diamonds?.total || 0}
            nextTier={nextTier}
          />
        )}

        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/60">
          <Gem className="h-3.5 w-3.5" style={{ color: '#F5C542' }} />
          {isOwner ? 'Kota Kademeleri (Yayıncı + Ajans)' : 'Kota Kademeleri (Yayıncı Kazancı)'}
        </p>

        <QuotaTierGrid
          tiers={tiers}
          monthDiamonds={monthDiamonds}
          nextTier={nextTier}
          trackProgress={role === 'broadcaster'}
          amountField="broadcaster_dollars"
          amountLabel="yayıncı kazancı"
          extraAmountField={isOwner ? 'agency_dollars' : ''}
          extraAmountLabel="ajans komisyonu"
        />

        <p className="text-[10px] leading-relaxed text-white/40">
          {isOwner
            ? `Her yayıncı kendi kotasını ayrı tamamlar; tamamlanan her kota için ajansına 200.000 elmas başına $${agency?.commission_per_200k || 3} komisyon işlenir. Bu ay işlenen komisyon: ${formatMoney(agency?.month_earnings || 0)}.`
            : isAssistant
              ? `Davet ettiğin yayıncıların tamamladığı her kota için ajans komisyonunun %${share} kadarı hesabına yazılır.`
              : 'Kademeler bu ayki elmas miktarına göre ilerler; tamamlanan her kademe kazancına eklenir.'}
        </p>
      </div>
    </AgencyPageShell>
  );
}