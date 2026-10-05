import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import AgencyPageShell from '@/components/agency/AgencyPageShell';
import AgencyTransfersList from '@/components/agency/AgencyTransfers';
import AgencyChangeSheet from '@/components/agency/AgencyChangeSheet';
import useAgencyPageData from '@/components/agency/useAgencyPageData';
import { agencySections } from '@/components/agency/agencySections';
import { useToast } from '@/components/ui/use-toast';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/** Transferler: ajans değişikliği talebi, onay süreci ve geçmiş kayıtlar. */
export default function AgencyTransfers() {
  const { toast } = useToast();
  const { user, role, agency, loading } = useAgencyPageData();
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [changeOpen, setChangeOpen] = useState(false);

  const load = useCallback(() => {
    agencyApi('transfers')
      .then((result) => setData(result))
      .catch(() => setData({ mine: [], approvals: [], history: [] }));
  }, []);

  useEffect(() => { if (user?.id) load(); }, [user?.id, load]);

  const decide = async (transfer, accept) => {
    setBusyId(transfer.id);
    try {
      const result = await agencyApi('transfer-respond', { transfer_id: transfer.id, accept });
      toast(accept
        ? { title: result.status === 'completed' ? 'Transfer tamamlandı' : 'Onay kaydedildi', description: result.status === 'completed' ? 'Yayıncı yeni ajansa geçti.' : 'Diğer tarafın onayı bekleniyor.' }
        : { title: 'Transfer reddedildi' });
      load();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  const cancel = async (transfer) => {
    setBusyId(transfer.id);
    try {
      await agencyApi('transfer-cancel', { transfer_id: transfer.id });
      toast({ title: 'Talep iptal edildi' });
      load();
    } catch (error) {
      toast({ title: 'İptal edilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <AgencyPageShell
      title="🔄 Transferler"
      subtitle={agency?.name || 'Ajans değişikliği talepleri'}
      sections={agencySections(role)}
      loading={loading}
    >
      <div className="space-y-3">
        {role === 'broadcaster' && (
          <button
            type="button"
            onClick={() => setChangeOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5C542]/45 bg-[#F5C542]/10 py-3 text-xs font-black active:scale-[0.99]"
            style={{ color: AGENCY_GOLD }}
          >
            <ArrowLeftRight className="h-4 w-4" /> Ajans Değişikliği Talebi Gönder
          </button>
        )}

        <AgencyTransfersList
          transfers={data?.history || []}
          userId={user?.id || ''}
          approveRole={role === 'owner'}
          busyId={busyId}
          onDecide={decide}
          onCancel={cancel}
        />
      </div>

      <AgencyChangeSheet open={changeOpen} onClose={() => setChangeOpen(false)} onChanged={load} />
    </AgencyPageShell>
  );
}