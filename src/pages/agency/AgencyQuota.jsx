import { Gem } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { currentPeriod } from '@/lib/agency';

/**
 * Kota Tablosu: kademeler ve ilerleme görünümü ajans sahibi ile yayıncıda birebir aynıdır —
 * sahip de kendi elmas ilerlemesini görür. Asistan yalnızca payına esas kademeleri okur.
 */
export default function AgencyQuota() {
  const { user, role, panel, broadcaster, assistant, loading } = useAgencyPageData();
  const isOwner = role === 'owner';
  const isAssistant = role === 'assistant';
  const showProgress = isOwner || role === 'broadcaster';
  const tiers = (isOwner ? panel?.tiers : broadcaster?.tiers) || [];
  const activeTiers = tiers.filter((tier) => tier.active !== false);
  // Sahip kendi elmasına göre ilerler; yayıncı ve asistan için yayıncı kaydı okunur.
  // Sahibin elması yalnızca bu ayki veri ise sayılır: geçen aydan kalan değer
  // bütün kademeleri tamamlanmış gösteriyordu.
  const ownerMonthFresh = user?.diamond_month_period === currentPeriod();
  const monthDiamonds = isOwner
    ? (ownerMonthFresh ? (Number(user?.diamond_month) || 0) : 0)
    : (broadcaster?.diamonds?.month || 0);
  const totalDiamonds = isOwner
    ? Math.round((Number(user?.gift_received_k) || 0) * 1000)
    : (broadcaster?.diamonds?.total || 0);
  // Sonraki kademe her iki rolde de tablodaki kademelerden hesaplanır: kart ile tablo aynı veriyi okur.
  const nextTier = activeTiers.find((tier) => Number(tier.diamonds) > monthDiamonds) || null;
  const share = Number(assistant?.assistant?.share) || 0;

  return (
    <AgencyPageShell
      title="💎 Kota Tablosu"
      subtitle={isAssistant ? `Asistan payı %${share}` : 'Kota kademeleri ve ilerlemen'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {showProgress && (
          <QuotaProgressCard month={monthDiamonds} total={totalDiamonds} nextTier={nextTier} tiers={activeTiers} />
        )}

        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/60">
          <Gem className="h-3.5 w-3.5" style={{ color: '#F5C542' }} />
          Kota Kademeleri (Yayıncı Kazancı)
        </p>

        <QuotaTierGrid
          tiers={tiers}
          monthDiamonds={monthDiamonds}
          nextTier={nextTier}
          trackProgress={showProgress}
          amountField="broadcaster_dollars"
          amountLabel="yayıncı kazancı"
        />

        <p className="text-[10px] leading-relaxed text-white/40">
          {isAssistant
            ? `Davet ettiğin yayıncıların tamamladığı her kota için ajans komisyonunun %${share} kadarı hesabına yazılır.`
            : 'Kademeler bu ayki elmas miktarına göre ilerler; tamamlanan her kademe kazancına eklenir.'}
        </p>
      </div>
    </AgencyPageShell>
  );
}