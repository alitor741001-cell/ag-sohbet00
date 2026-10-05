import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyAssistantCard from '@/components/agency/AgencyAssistantCard';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { Handshake } from 'lucide-react';

/**
 * Asistanlar: her asistanın ismi profili, payı ve davet ettiği yayıncıların
 * kota durumu görünür; buradan asistanlık geri alınabilir.
 */
export default function AgencyAssistants() {
  const { role, agency, panel, loading, reload } = useAgencyPageData();
  const assistants = panel?.assistants || [];

  return (
    <AgencyPageShell
      title="🤝 Asistanlar"
      subtitle={agency?.name ? `${agency.name} • ${assistants.length} asistan` : 'Ajans asistanları'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {assistants.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
            <Handshake className="mx-auto h-6 w-6 text-white/30" />
            <p className="mt-2 text-xs font-semibold text-white/60">Henüz asistanın yok</p>
            <p className="text-[11px] text-white/40">Ajansım bölümünden üye kimliğiyle asistanlık verebilirsin.</p>
          </div>
        ) : assistants.map((assistant) => (
          <AgencyAssistantCard key={assistant.user_id} assistant={assistant} onChanged={reload} />
        ))}
      </div>
    </AgencyPageShell>
  );
}