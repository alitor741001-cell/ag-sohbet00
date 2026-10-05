import { useEffect } from 'react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import AgencyPerformanceCharts from '@/components/agency/AgencyPerformanceCharts';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/** Yayıncı Paneli: yayıncıların canlı kota ilerlemeleri, performans grafikleri ve bu ayki elmasları. */
export default function AgencyBroadcasters() {
  const { role, agency, panel, loading, refresh } = useAgencyPageData();

  // Kota takibi canlı kalsın: sayfa açıkken ve sekmeye dönüldüğünde veri sessizce yenilenir.
  useEffect(() => {
    const timer = setInterval(() => refresh(), 45000);
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  const members = panel?.members || [];

  return (
    <AgencyPageShell
      title="🎤 Yayıncı Paneli"
      subtitle={agency?.name ? `${agency.name} • ${members.length} yayıncı` : ''}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        <AgencyPerformanceCharts members={members} />
        <AgencyBroadcasterList members={members} />
      </div>
    </AgencyPageShell>
  );
}