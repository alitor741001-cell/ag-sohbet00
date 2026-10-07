import { useEffect, useState } from 'react';
import { Check, FileImage, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import { agencyApi, dateText } from '@/lib/agency';

/**
 * Yönetim paneli — fotoğraflı normal transfer talepleri. Fotoğraf özel alanda durur,
 * incelenirken imzalı bağlantıyla açılır. Onaylanan talep yayıncıyı yeni ajansa geçirir;
 * eski ajans etiketi ve varsa asistanlığı kalkar.
 */
export default function AdminManualTransferTable({ data = {}, reload }) {
  const { toast } = useToast();
  const requests = data.manual_transfers || [];
  const [urls, setUrls] = useState({});
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let active = true;
    const pending = (data.manual_transfers || []).filter((row) => row.status === 'pending' && row.photo_uri);
    if (!pending.length) return () => { active = false; };
    (async () => {
      const next = {};
      for (const row of pending) {
        try {
          const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: row.photo_uri, expires_in: 900 });
          next[row.id] = res?.signed_url || '';
        } catch {
          next[row.id] = '';
        }
      }
      if (active) setUrls(next);
    })();
    return () => { active = false; };
  }, [data.manual_transfers]);

  const decide = async (request, approve) => {
    setBusyId(request.id);
    try {
      const result = await agencyApi('admin-manual-transfer-decide', { transfer_id: request.id, approve, note: notes[request.id] || '' });
      toast({
        title: result.status === 'completed' ? 'Transfer tamamlandı' : 'Talep reddedildi',
        description: result.status === 'completed' ? 'Yayıncı yeni ajansa geçti.' : 'Talebi gönderen bilgilendirildi.',
      });
      reload?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setBusyId(''); }
  };

  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
        <FileImage className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-sm text-white/50">Normal transfer talebi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((row) => {
        const pending = row.status === 'pending';
        return (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{row.user_name}</p>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${pending ? 'border-[#F5C542]/45 text-[#F5C542]' : row.status === 'completed' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-[#FF8080]/45 text-[#FF8080]'}`}>
                {pending ? 'İnceleme bekliyor' : row.status === 'completed' ? 'Tamamlandı' : row.status === 'rejected' ? 'Reddedildi' : 'İptal edildi'}
              </span>
            </div>
            <p className="mt-1.5 truncate text-[11px] text-white/60">
              {row.from_agency_name || 'Eski ajans'} <span className="text-[#F5C542]">→</span>{' '}
              <span className="font-semibold text-white">{row.to_agency_name}</span>
            </p>
            {row.note && <p className="mt-1 text-[10px] text-white/50">Talep notu: {row.note}</p>}
            {row.admin_note && <p className="mt-1 text-[10px] text-white/50">Yönetici notu: {row.admin_note}</p>}
            <p className="mt-1 text-[10px] text-white/35">{dateText(row.created_date)}</p>

            {pending && (
              <div className="mt-2 overflow-hidden rounded-xl border border-white/12 bg-black/40">
                {urls[row.id] ? (
                  <Image src={urls[row.id]} className="max-h-72 w-full object-contain" fittingType="fit" />
                ) : (
                  <p className="flex items-center justify-center gap-1.5 py-6 text-[11px] text-white/45">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fotoğraf hazırlanıyor…
                  </p>
                )}
              </div>
            )}

            {pending && (
              <>
                <input
                  value={notes[row.id] || ''}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                  maxLength={300}
                  placeholder="Not (isteğe bağlı): red/onay gerekçesi"
                  className="mt-2 w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2 text-[11px] outline-none focus:border-[#F5C542]/60"
                />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => decide(row, true)} disabled={busyId === row.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#4ade80]/50 bg-[#4ade80]/10 py-2 text-xs font-bold text-[#4ade80] disabled:opacity-50">
                    {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Onayla ve geçir
                  </button>
                  <button onClick={() => decide(row, false)} disabled={busyId === row.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#FF8080]/50 bg-[#FF8080]/10 py-2 text-xs font-bold text-[#FF8080] disabled:opacity-50">
                    <X className="h-3.5 w-3.5" /> Reddet
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}