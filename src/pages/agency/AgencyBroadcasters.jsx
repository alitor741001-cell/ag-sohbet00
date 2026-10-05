import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/** Yayıncı Paneli: ajansın yayıncıları, durumları, kotaları ve bu ayki elmasları. */
export default function AgencyBroadcasters() {
  const { role, agency, panel, loading } = useAgencyPageData();

  return (
    <AgencyPageShell
      title="🎤 Yayıncı Paneli"
      subtitle={agency?.name ? `${agency.name} • ${panel?.members?.length || 0} yayıncı` : ''}
      sections={agencySections(role)}
      loading={loading}
    >
      <AgencyBroadcasterList members={panel?.members || []} />
    </AgencyPageShell>
  );
}