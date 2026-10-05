import { useEffect } from 'react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import AgencyInviteSender from '@/components/agency/AgencyInviteSender';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/**
 * Yayıncı Paneli: ajans sahibi tüm yayıncıları, asistan yalnızca kendi davet
 * ettiği yayıncıları ve onların canlı kota ilerlemesini görür.
 */
export default function AgencyBroadcasters() {
  const { role, agency, panel, assistant, loading, refresh } = useAgencyPageData();
  const isAssistant = role === 'assistant';
  const members = isAssistant ? (assistant?.members || []) : (panel?.members || []);
  const share = isAssistant ? Number(assistant?.assistant?.share) || 0 : 0;

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

  return (
    <AgencyPageShell
      title={isAssistant ? '🎤 Yayıncılarım' : '🎤 Yayıncı Paneli'}
      subtitle={agency?.name ? `${agency.name} • ${members.length} yayıncı` : ''}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {isAssistant && (
          <AgencyInviteSender invites={assistant?.invites_sent || []} onChanged={refresh} />
        )}
        <AgencyBroadcasterList members={members} share={share} />
      </div>
    </AgencyPageShell>
  );
}