import { useState } from 'react';
import { Building2, Hourglass, Loader2, Plus, Save, Trash2, UserCog } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, agencyApi, dateText, formatMoney } from '@/lib/agency';

/** Yönetim paneli — ajans listesi: oluştur, düzenle, sahip değiştir, sil. */
export default function AdminAgencyList({ data = {}, reload }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [ownerMemberId, setOwnerMemberId] = useState('');
  const [commission, setCommission] = useState('3');
  const [busy, setBusy] = useState('');
  const [drafts, setDrafts] = useState({});

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

  const create = async () => {
    if (!name.trim() || !ownerMemberId.trim()) {
      toast({ title: 'Ajans adı ve sahip üye kimliği gerekli', variant: 'destructive' });
      return;
    }
    await run('create', 'admin-agency-save', { name: name.trim(), owner_member_id: ownerMemberId.trim(), commission_per_200k: Number(commission) || 3 }, 'Ajans oluşturuldu');
    setName(''); setOwnerMemberId('');
  };

  const update = (agency) => {
    const draft = drafts[agency.id] || {};
    run(agency.id, 'admin-agency-save', {
      agency_id: agency.id,
      name: draft.name ?? agency.name,
      description: agency.description || '',
      logo: agency.logo || '',
      commission_per_200k: Number(draft.commission ?? agency.commission_per_200k ?? 3),
    }, 'Ajans güncellendi');
  };

  const decide = (agency, approve) => run(agency.id, 'admin-agency-decide', { agency_id: agency.id, approve }, approve ? `${agency.name} ajansı onaylandı` : `${agency.name} başvurusu reddedildi`);

  const pending = (data.agencies || []).filter((agency) => agency.status === 'pending');

  const changeOwner = (agency) => {
    const memberId = window.prompt('Yeni sahibin üye kimliği:');
    if (!memberId) return;
    run(agency.id + '-owner', 'admin-set-owner', { agency_id: agency.id, member_id: memberId.trim() }, 'Ajans sahibi değişti');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 p-4">
        <p className="flex items-center gap-2 text-sm font-black" style={{ color: AGENCY_GOLD }}><Plus className="h-4 w-4" /> Yeni Ajans</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ajans adı" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <input value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)} placeholder="Sahip üye kimliği" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <div className="flex gap-2">
            <input value={commission} onChange={(event) => setCommission(event.target.value)} inputMode="decimal" placeholder="Komisyon / 200K" className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
            <button onClick={create} disabled={busy === 'create'} className="shrink-0 rounded-xl px-4 text-sm font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
              {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
            </button>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-[#F5C542]/45 bg-[#F5C542]/5 p-4">
          <p className="flex items-center gap-2 text-sm font-black" style={{ color: AGENCY_GOLD }}>
            <Hourglass className="h-4 w-4" /> Onay Bekleyen Başvurular ({pending.length})
          </p>
          <div className="mt-3 space-y-2">
            {pending.map((agency) => (
              <div key={agency.id} className="flex items-center gap-3 rounded-xl border border-white/12 bg-black/40 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#F5C542]/40 bg-black/50">
                  {agency.logo ? <Image src={agency.logo} className="h-full w-full object-cover" fittingType="fill" /> : <Building2 className="h-4 w-4" style={{ color: AGENCY_GOLD }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{agency.name}</p>
                  <p className="truncate text-[11px] text-white/50">{agency.owner_name} • {agency.agency_id} • {dateText(agency.created_date)}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => decide(agency, true)} disabled={busy === agency.id} className="inline-flex min-h-11 items-center rounded-lg px-3 text-[11px] font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
                    {busy === agency.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Onayla'}
                  </button>
                  <button onClick={() => decide(agency, false)} disabled={busy === agency.id} className="inline-flex min-h-11 items-center rounded-lg border border-[#FF8080]/45 px-3 text-[11px] font-bold text-[#FF8080] disabled:opacity-60">
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.agencies || []).length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-sm text-white/50">Henüz ajans yok.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {(data.agencies || []).map((agency) => {
            const draft = drafts[agency.id] || {};
            return (
              <div key={agency.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#F5C542]/40 bg-black/50">
                    {agency.logo ? <Image src={agency.logo} className="h-full w-full object-cover" fittingType="fill" /> : <Building2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{agency.name}</p>
                    <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>{agency.agency_id} • {agency.owner_name}</p>
                    <p className="truncate text-[10px] text-white/45">{agency.member_count || 0} yayıncı • {formatMoney(agency.total_earnings || 0)} komisyon</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    value={draft.name ?? agency.name}
                    onChange={(event) => setDrafts((current) => ({ ...current, [agency.id]: { ...current[agency.id], name: event.target.value } }))}
                    className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs outline-none focus:border-[#F5C542]/60"
                  />
                  <input
                    value={draft.commission ?? agency.commission_per_200k ?? 3}
                    onChange={(event) => setDrafts((current) => ({ ...current, [agency.id]: { ...current[agency.id], commission: event.target.value } }))}
                    inputMode="decimal"
                    className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs outline-none focus:border-[#F5C542]/60"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => update(agency)} disabled={busy === agency.id} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
                    {busy === agency.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Kaydet
                  </button>
                  <button onClick={() => changeOwner(agency)} disabled={busy === agency.id + '-owner'} className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/70 disabled:opacity-60">
                    <UserCog className="h-3.5 w-3.5" /> Sahip Değiştir
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`${agency.name} ajansı silinsin mi? Yayıncıların ajans bağlantısı kaldırılır.`)) run(agency.id + '-delete', 'admin-agency-delete', { agency_id: agency.id }, 'Ajans silindi'); }}
                    disabled={busy === agency.id + '-delete'}
                    className="flex items-center gap-1.5 rounded-xl border border-[#FF8080]/45 px-3 py-2 text-xs font-bold text-[#FF8080] disabled:opacity-60"
                  >
                    {busy === agency.id + '-delete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}