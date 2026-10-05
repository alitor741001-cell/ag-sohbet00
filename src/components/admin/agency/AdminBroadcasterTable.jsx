import { useState } from 'react';
import { Loader2, Mic2, Plus, Power, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, agencyApi, formatShortDiamonds } from '@/lib/agency';

/** Yönetim paneli — yayıncı listesi: ekle, ajans ata, durum değiştir, kaldır. */
export default function AdminBroadcasterTable({ data = {}, reload }) {
  const { toast } = useToast();
  const [memberId, setMemberId] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [busy, setBusy] = useState('');

  const run = async (key, action, payload, success) => {
    setBusy(key);
    try {
      await agencyApi(action, payload);
      toast({ title: success });
      reload?.();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const add = async () => {
    if (!memberId.trim() || !agencyCode.trim()) {
      toast({ title: 'Üye kimliği ve ajans kimliği gerekli', variant: 'destructive' });
      return;
    }
    const agency = (data.agencies || []).find((row) => row.agency_id === agencyCode.trim().toUpperCase());
    if (!agency) {
      toast({ title: 'Ajans bulunamadı', variant: 'destructive' });
      return;
    }
    await run('add', 'admin-broadcaster-add', { member_id: memberId.trim(), agency_id: agency.id }, 'Yayıncı ajansa eklendi');
    setMemberId(''); setAgencyCode('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 p-4">
        <p className="flex items-center gap-2 text-sm font-black" style={{ color: AGENCY_GOLD }}><Plus className="h-4 w-4" /> Yayıncı Ekle</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="Üye kimliği" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <input value={agencyCode} onChange={(event) => setAgencyCode(event.target.value.toUpperCase())} placeholder="Ajans kimliği (AG-000000)" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <button onClick={add} disabled={busy === 'add'} className="rounded-xl py-2.5 text-sm font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
            {busy === 'add' ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Ekle'}
          </button>
        </div>
      </div>

      {(data.broadcasters || []).length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-sm text-white/50">Henüz yayıncı yok.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {(data.broadcasters || []).map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 border-b border-white/8 p-3 last:border-b-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/50">
                {row.avatar ? <Image src={row.avatar} className="h-full w-full object-cover" fittingType="fill" /> : <Mic2 className="h-4 w-4 text-white/50" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{row.name}</p>
                <p className="truncate text-[10px] text-white/45">#{row.member_id} • {row.agency_name || 'Ajans yok'} {row.agency_code ? `(${row.agency_code})` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-white">{formatShortDiamonds(row.diamonds)}</p>
                <p className="text-[10px] text-white/45">bu ayki elmas</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => run(row.id + '-status', 'admin-broadcaster-status', { user_id: row.id, status: row.status === 'active' ? 'inactive' : 'active' }, row.status === 'active' ? 'Yayıncı pasife alındı' : 'Yayıncı aktifleştirildi')}
                  disabled={busy === row.id + '-status'}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60 ${row.status === 'active' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/50'}`}
                >
                  <Power className="h-3.5 w-3.5" /> {row.status === 'active' ? 'Aktif' : 'Pasif'}
                </button>
                <button
                  onClick={() => run(row.id + '-remove', 'admin-broadcaster-remove', { user_id: row.id }, 'Yayıncı ajandan çıkarıldı')}
                  disabled={busy === row.id + '-remove'}
                  className="flex items-center gap-1 rounded-lg border border-[#FF8080]/45 px-2.5 py-1.5 text-[11px] font-bold text-[#FF8080] disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Çıkar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}