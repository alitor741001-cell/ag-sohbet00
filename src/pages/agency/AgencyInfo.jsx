import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyInfoCard from '@/components/agency/AgencyInfoCard';
import AgencySettingsForm from '@/components/agency/AgencySettingsForm';
import AgencyAssistantPanel from '@/components/agency/AgencyAssistantPanel';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';

/** Ajansım: ajans bilgileri, kurallar, (sahibiyse) asistanlık ve ajans ayarları. */
export default function AgencyInfo() {
  const { role, agency, panel, loading, reload } = useAgencyPageData();
  const canEdit = role === 'owner' || role === 'pending';
  const isOwner = role === 'owner';

  return (
    <AgencyPageShell
      title="🏢 Ajansım"
      subtitle={agency?.agency_id ? `Ajans ID: ${agency.agency_id}` : 'Ajans bilgileri'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Yayıncı ve asistanlar ajansın yayıncı sayısını görmez. */}
        <AgencyInfoCard agency={agency || {}} hideMemberCount={!isOwner} />
        {isOwner && <AgencyAssistantPanel assistants={panel?.assistants || []} onChanged={reload} />}
        {canEdit ? (
          <AgencySettingsForm agency={agency || {}} onSaved={reload} />
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-xs text-white/50">
            Yalnızca ajans sahibi ayarları değiştirebilir.
          </p>
        )}
      </div>
    </AgencyPageShell>
  );
}