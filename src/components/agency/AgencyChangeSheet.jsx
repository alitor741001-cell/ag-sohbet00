import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, Loader2, MoveRight, Search, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import AgencySheet from '@/components/agency/AgencySheet';
import AgencyTransfers from '@/components/agency/AgencyTransfers';
import { AGENCY_GOLD, agencyApi } from '@/lib/agency';

/**
 * Ajans değişikliği: yeni ajans kimliği sorgulanır, ajans bilgileri görünür ve
 * "Başvur" ile transfer talebi gönderilir; süreç eski + yeni sahip onayıyla tamamlanır.
 */
export default function AgencyChangeSheet({ open, onClose, onChanged }) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [target, setTarget] = useState(null);
  const [looking, setLooking] = useState(false);
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

  const lookup = async () => {
    const value = code.trim().toUpperCase();
    if (!value || looking) return;
    setLooking(true);
    setTarget(null);
    try {
      const data = await agencyApi('agency-lookup', { agency_code: value });
      setTarget(data.agency || null);
    } catch (error) {
      toast({ title: 'Ajans bulunamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setLooking(false);
    }
  };

  const apply = async () => {
    if (!target || busy) return;
    setBusy(true);
    try {
      const data = await agencyApi('transfer-request', { agency_code: target.agency_id });
      toast({
        title: 'Başvuru gönderildi',
        description: `${data.transfer?.from_agency_name || 'Eski ajans'} → ${data.transfer?.to_agency_name} • Eski ve yeni ajans sahibinin onayı bekleniyor.`,
      });
      setCode('');
      setTarget(null);
      load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'Başvuru gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
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
    <AgencySheet open={open} tall onClose={onClose} icon={ArrowLeftRight} title="🔄 Ajans Değişikliği" subtitle="Yeni ajans kimliğini gir, ajansı gör ve başvur">
      <div className="space-y-4 pb-2">
        <div className="rounded-2xl border border-[#5AB8FF]/35 bg-gradient-to-br from-[#0b1b2c] to-[#0b0910] p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5AB8FF]">Yeni Ajans Kimliği</p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(event) => { setCode(event.target.value.toUpperCase()); setTarget(null); }}
              placeholder="AG-000000"
              maxLength={9}
              className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/50 px-4 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-[#5AB8FF]/70"
            />
            <button onClick={lookup} disabled={looking || code.trim().length < 3} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 px-3.5 py-2.5 text-xs font-bold disabled:opacity-50">
              {looking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Sorgula
            </button>
          </div>

          {target && (
            <div className="mt-3 rounded-2xl border border-[#F5C542]/35 bg-black/40 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F5C542]/45 bg-black/50">
                  {target.logo
                    ? <Image src={target.logo} className="h-full w-full object-cover" fittingType="fill" />
                    : <Building2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{target.name}</p>
                  <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>{target.agency_id}</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/50">{target.description || 'Yayıncı ajansı'}</p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-black/40 px-1 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">Sahip</p>
                  <p className="truncate text-[11px] font-black text-white">{target.owner_name || '—'}</p>
                </div>
                <div className="rounded-xl bg-black/40 px-1 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">Yayıncı</p>
                  <p className="text-[11px] font-black text-white">{target.member_count || 0}</p>
                </div>
                <div className="rounded-xl bg-black/40 px-1 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">Komisyon</p>
                  <p className="text-[11px] font-black" style={{ color: AGENCY_GOLD }}>${target.commission_per_200k ?? 3}</p>
                </div>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-white/50">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" style={{ color: AGENCY_GOLD }} />
                Başvurun, eski ve yeni ajans sahibinin onayından sonra tamamlanır. Tüm transferler kayıt altına alınır.
              </p>
              <button
                onClick={apply}
                disabled={busy}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] py-3.5 text-sm font-black text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />} Başvur
              </button>
            </div>
          )}
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