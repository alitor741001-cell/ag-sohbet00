import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Loader2, MoveRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AgencySheet from '@/components/agency/AgencySheet';
import AgencyTransfers from '@/components/agency/AgencyTransfers';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/** Ajans değişikliği: yeni ajans kimliğiyle talep gönder, onay sürecini takip et. */
export default function AgencyChangeSheet({ open, onClose, onChanged }) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [mine, setMine] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    agencyApi('transfers')
      .then((data) => { setMine(data.mine || []); setApprovals(data.approvals || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const request = async () => {
    const value = code.trim().toUpperCase();
    if (!value || busy) return;
    if (!window.confirm(`Ajans değişikliği talebi gönderilsin mi?\nYeni Ajans: ${value}\n\nEski ve yeni ajans sahibinin onayından sonra transfer tamamlanır.`)) return;
    setBusy(true);
    try {
      const data = await agencyApi('transfer-request', { agency_code: value });
      toast({
        title: 'Transfer talebi gönderildi',
        description: `${data.transfer?.from_agency_name || 'Eski ajans'} → ${data.transfer?.to_agency_name} • Eski ve yeni ajans sahibinin onayı bekleniyor.`,
      });
      setCode('');
      load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'Talep gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (transfer) => {
    setBusyId(transfer.id);
    try {
      await agencyApi('transfer-cancel', { transfer_id: transfer.id });
      toast({ title: 'Talep iptal edildi' });
      load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'İptal edilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <AgencySheet open={open} tall onClose={onClose} icon={ArrowLeftRight} title="🔄 Ajans Değişikliği" subtitle="Yeni ajans kimliğiyle transfer talebi gönder">
      <div className="space-y-4 pb-2">
        <div className="rounded-2xl border border-[#5AB8FF]/35 bg-gradient-to-br from-[#0b1b2c] to-[#0b0910] p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5AB8FF]">Yeni Ajans Kimliği</p>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="AG-000000"
            maxLength={9}
            className="mt-2 w-full rounded-xl border border-white/12 bg-black/50 px-4 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-[#5AB8FF]/70"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-white/50">
            Transfer, eski ve yeni ajans sahibinin onayından sonra otomatik tamamlanır. Tüm transferler kayıt altına alınır.
          </p>
          <button onClick={request} disabled={busy || code.trim().length < 3} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] py-3.5 text-sm font-black text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />} Ajans Değiştir
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: AGENCY_GOLD }} /></div>
        ) : (
          <>
            {approvals.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Onayını Bekleyen Talepler</p>
                <AgencyTransfers transfers={approvals} approveRole busyId={busyId} onDecide={async (transfer, accept) => {
                  setBusyId(transfer.id);
                  try {
                    await agencyApi('transfer-respond', { transfer_id: transfer.id, accept });
                    toast({ title: accept ? 'Onay kaydedildi' : 'Talep reddedildi' });
                    load();
                  } catch (error) {
                    toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
                  } finally { setBusyId(''); }
                }} />
              </div>
            )}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/50">Transfer Geçmişim</p>
              <AgencyTransfers transfers={mine} busyId={busyId} onCancel={cancel} />
            </div>
          </>
        )}
      </div>
    </AgencySheet>
  );
}