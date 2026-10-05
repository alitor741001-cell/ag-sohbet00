import { useState } from 'react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyInviteSender from '@/components/agency/AgencyInviteSender';
import AgencyInvitesPanel from '@/components/agency/AgencyInvitesPanel';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/** Davetler: yayıncı daveti gönderme, gelen/giden davetler ve davet yanıtı. */
export default function AgencyInvites() {
  const { role, agency, panel, loading, reload } = useAgencyPageData();
  const [inviteId, setInviteId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const afterAnswer = () => {
    setInviteId('');
    setRefreshKey((value) => value + 1);
    reload();
  };

  return (
    <AgencyPageShell
      title="📨 Davetler"
      subtitle={agency?.name || 'Yayıncı davetleri'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {role === 'owner' && <AgencyInviteSender invites={panel?.invites || []} onChanged={reload} />}
        <AgencyInvitesPanel open onOpenInvite={setInviteId} refreshKey={refreshKey} />
      </div>

      <InviteDetailSheet
        open={!!inviteId}
        inviteId={inviteId}
        onClose={() => setInviteId('')}
        onAnswered={afterAnswer}
      />
    </AgencyPageShell>
  );
}