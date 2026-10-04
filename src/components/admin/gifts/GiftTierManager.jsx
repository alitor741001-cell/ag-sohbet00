import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { formatK } from '@/lib/giftTone';

const EMPTY = { name: '', min_k: 0, color: '#ef4444', glow: '#ff4500', sort_order: 0, active: true };
const inputClass = 'w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none';

/** Admin: K renk/seviye eşikleri — hediye ve seçim renkleri bu eşiklere göre değişir. */
export default function GiftTierManager() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => base44.entities.GiftTier.list('min_k', 100).then(setItems).catch(() => {});
  useEffect(load, []);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), min_k: Math.max(0, Number(form.min_k) || 0), sort_order: Number(form.sort_order) || 0 };
    if (editingId) await base44.entities.GiftTier.update(editingId, payload);
    else await base44.entities.GiftTier.create(payload);
    toast({ title: editingId ? 'Seviye güncellendi' : 'Seviye eklendi' });
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const startEdit = (tier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name || '', min_k: Number(tier.min_k) || 0, color: tier.color || '#ef4444',
      glow: tier.glow || '#ff4500', sort_order: Number(tier.sort_order) || 0, active: tier.active !== false,
    });
  };

  const toggleActive = async (tier) => {
    await base44.entities.GiftTier.update(tier.id, { active: tier.active === false });
    load();
  };

  const remove = async (tier) => {
    await base44.entities.GiftTier.delete(tier.id);
    toast({ title: 'Seviye silindi' });
    setConfirmId(null);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem,1fr]">
      <form onSubmit={submit} className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">{editingId ? 'Seviyeyi düzenle' : 'Yeni K seviyesi'}</p>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Seviye adı (örn: Altın)" className={inputClass} />
        <input type="number" min="0" value={form.min_k} onChange={(e) => set({ min_k: e.target.value })} placeholder="Başlangıç K değeri" className={inputClass} />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs font-semibold">
            Renk
            <input type="color" value={form.color} onChange={(e) => set({ color: e.target.value })} className="ml-auto h-7 w-10 rounded" />
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs font-semibold">
            Parlama
            <input type="color" value={form.glow} onChange={(e) => set({ glow: e.target.value })} className="ml-auto h-7 w-10 rounded" />
          </label>
        </div>
        <input type="number" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} placeholder="Sıra" className={inputClass} />
        <label className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
          <span>Aktif</span>
          <input type="checkbox" checked={form.active !== false} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" />
        </label>
        <div className="flex gap-2 pt-1">
          <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            {editingId ? 'KAYDET' : 'EKLE'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold">
              İPTAL
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">K değeri bu eşiğe ulaşan hediyeler ilgili rengi ve efektini alır.</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz seviye yok.</p>
        ) : (
          items.map((tier) => (
            <div key={tier.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.glow})`, boxShadow: `0 0 14px ${tier.color}` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: tier.color }}>
                  {tier.name} {tier.active === false && <span className="text-xs text-muted-foreground">(pasif)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{formatK(tier.min_k)} ve üzeri</p>
              </div>
              <button type="button" onClick={() => toggleActive(tier)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold">
                {tier.active === false ? 'Aktif et' : 'Pasif yap'}
              </button>
              <button type="button" onClick={() => startEdit(tier)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /></button>
              {confirmId === tier.id ? (
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => remove(tier)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white">Sil</button>
                  <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold">Vazgeç</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmId(tier.id)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}