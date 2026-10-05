import { useState } from 'react';
import { Check, Gem, Loader2, Plus, Trash2, Undo2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AGENCY_GOLD, agencyApi, formatMoney, formatShortDiamonds, tierStyle } from '@/lib/agency';

/** Yönetim paneli — kota tablosu: kademe ekle, güncelle, sil. */
export default function AdminQuotaTiers({ data = {}, reload }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ diamonds: '', broadcaster_dollars: '', agency_dollars: '' });
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

  const add = async () => {
    if (!form.diamonds || !form.broadcaster_dollars) {
      toast({ title: 'Elmas ve yayıncı kazancı gerekli', variant: 'destructive' });
      return;
    }
    await run('add', 'admin-tier-save', {
      diamonds: Number(form.diamonds),
      broadcaster_dollars: Number(form.broadcaster_dollars),
      agency_dollars: form.agency_dollars ? Number(form.agency_dollars) : undefined,
    }, 'Kota kademesi eklendi');
    setForm({ diamonds: '', broadcaster_dollars: '', agency_dollars: '' });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 p-4">
        <p className="flex items-center gap-2 text-sm font-black" style={{ color: AGENCY_GOLD }}><Plus className="h-4 w-4" /> Kota Kademesi Ekle</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input value={form.diamonds} onChange={(event) => setForm((current) => ({ ...current, diamonds: event.target.value }))} inputMode="numeric" placeholder="Elmas" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <input value={form.broadcaster_dollars} onChange={(event) => setForm((current) => ({ ...current, broadcaster_dollars: event.target.value }))} inputMode="decimal" placeholder="Yayıncı $ (200K→15)" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <input value={form.agency_dollars} onChange={(event) => setForm((current) => ({ ...current, agency_dollars: event.target.value }))} inputMode="decimal" placeholder="Ajans $ (boş: 200K→3)" className="rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#F5C542]/60" />
          <button onClick={add} disabled={busy === 'add'} className="rounded-xl py-2.5 text-sm font-black text-black disabled:opacity-60" style={{ background: AGENCY_GOLD }}>
            {busy === 'add' ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Ekle'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {(data.tiers || []).map((tier) => {
          const style = tierStyle(tier.diamonds);
          const draft = drafts[tier.id] || {};
          return (
            <div key={tier.id} className="flex flex-wrap items-center gap-2 border-b border-white/8 p-3 last:border-b-0">
              <span className={`flex min-w-[86px] items-center gap-1 rounded-lg border px-2 py-1 text-xs font-black ${style.border} ${style.text}`}>
                <Gem className="h-3 w-3" /> {formatShortDiamonds(tier.diamonds)}
              </span>
              <input
                value={draft.diamonds ?? tier.diamonds}
                onChange={(event) => setDrafts((current) => ({ ...current, [tier.id]: { ...current[tier.id], diamonds: event.target.value } }))}
                inputMode="numeric"
                className="w-24 rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-[#F5C542]/60"
              />
              <input
                value={draft.broadcaster_dollars ?? tier.broadcaster_dollars}
                onChange={(event) => setDrafts((current) => ({ ...current, [tier.id]: { ...current[tier.id], broadcaster_dollars: event.target.value } }))}
                inputMode="decimal"
                className="w-24 rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-[#F5C542]/60"
              />
              <input
                value={draft.agency_dollars ?? tier.agency_dollars}
                onChange={(event) => setDrafts((current) => ({ ...current, [tier.id]: { ...current[tier.id], agency_dollars: event.target.value } }))}
                inputMode="decimal"
                className="w-24 rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-[#F5C542]/60"
              />
              <span className="text-[10px] text-white/40">yayıncı / ajans $</span>
              <div className="ml-auto flex gap-1.5">
                <button
                  onClick={() => run(tier.id, 'admin-tier-save', {
                    id: tier.id,
                    diamonds: Number(draft.diamonds ?? tier.diamonds),
                    broadcaster_dollars: Number(draft.broadcaster_dollars ?? tier.broadcaster_dollars),
                    agency_dollars: Number(draft.agency_dollars ?? tier.agency_dollars),
                    active: tier.active !== false,
                  }, 'Kademe güncellendi')}
                  disabled={busy === tier.id}
                  className="flex items-center gap-1 rounded-lg border border-[#4ade80]/45 px-2.5 py-1.5 text-[11px] font-bold text-[#4ade80] disabled:opacity-60"
                >
                  {busy === tier.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Kaydet
                </button>
                <button
                  onClick={() => run(tier.id + '-toggle', 'admin-tier-save', {
                    id: tier.id, diamonds: Number(tier.diamonds), broadcaster_dollars: Number(tier.broadcaster_dollars),
                    agency_dollars: Number(tier.agency_dollars), active: tier.active === false,
                  }, tier.active === false ? 'Kademe aktifleştirildi' : 'Kademe pasife alındı')}
                  disabled={busy === tier.id + '-toggle'}
                  className="flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-[11px] font-bold text-white/60 disabled:opacity-60"
                >
                  <Undo2 className="h-3.5 w-3.5" /> {tier.active === false ? 'Pasif' : 'Aktif'}
                </button>
                <button
                  onClick={() => { if (window.confirm(`${formatShortDiamonds(tier.diamonds)} kademesi silinsin mi?`)) run(tier.id + '-delete', 'admin-tier-delete', { id: tier.id }, 'Kademe silindi'); }}
                  disabled={busy === tier.id + '-delete'}
                  className="flex items-center gap-1 rounded-lg border border-[#FF8080]/45 px-2.5 py-1.5 text-[11px] font-bold text-[#FF8080] disabled:opacity-60"
                >
                  {busy === tier.id + '-delete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        {(data.tiers || []).length === 0 && <p className="py-10 text-center text-sm text-white/50">Kota tablosu boş.</p>}
      </div>

      <p className="text-[11px] text-white/45">
        Varsayılan komisyon: 200.000 elmas → <span className="font-bold text-white">{formatMoney(3)}</span> ajans kazancı, yayıncı kazancı 200.000 elmas → 15$.
      </p>
    </div>
  );
}