import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { formatK, tierForK, toneColor } from '@/lib/giftTone';

const EMPTY = { name: '', emoji: '🎁', image_url: '', k_value: 10, category: 'Klasik', sort_order: 0, active: true };

const inputClass = 'w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none';

/** Admin: hediye ekleme, görsel yükleme, K fiyatı, kategori, sıra ve aktif/pasif yönetimi. */
export default function GiftManager() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    base44.entities.Gift.list('sort_order', 200).then(setItems).catch(() => {});
    base44.entities.GiftTier.filter({ active: true }, 'sort_order', 50).then(setTiers).catch(() => {});
  };
  useEffect(load, []);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      name: form.name.trim(),
      emoji: form.emoji || '🎁',
      k_value: Math.max(0, Number(form.k_value) || 0),
      sort_order: Number(form.sort_order) || 0,
      active: form.active !== false,
    };
    if (editingId) await base44.entities.Gift.update(editingId, payload);
    else await base44.entities.Gift.create(payload);
    toast({ title: editingId ? 'Hediye güncellendi' : 'Hediye eklendi' });
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const startEdit = (gift) => {
    setEditingId(gift.id);
    setForm({
      name: gift.name || '', emoji: gift.emoji || '🎁', image_url: gift.image_url || '',
      k_value: Number(gift.k_value) || 0, category: gift.category || 'Klasik',
      sort_order: Number(gift.sort_order) || 0, active: gift.active !== false,
    });
  };

  // Hediye görseli: genel (public) depoya yüklenir, herkes görebilir.
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set({ image_url: file_url });
      toast({ title: 'Görsel yüklendi' });
    } catch (error) {
      toast({ title: 'Görsel yüklenemedi', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (gift) => {
    await base44.entities.Gift.update(gift.id, { active: gift.active === false });
    toast({ title: gift.active === false ? 'Hediye aktif' : 'Hediye pasif' });
    load();
  };

  const move = async (gift, direction) => {
    await base44.entities.Gift.update(gift.id, { sort_order: (Number(gift.sort_order) || 0) + direction });
    load();
  };

  const remove = async (gift) => {
    await base44.entities.Gift.delete(gift.id);
    toast({ title: 'Hediye silindi' });
    setConfirmId(null);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem,1fr]">
      <form onSubmit={submit} className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">{editingId ? 'Hediyeyi düzenle' : 'Yeni hediye'}</p>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Hediye adı (örn: Gül)" className={inputClass} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.emoji} onChange={(e) => set({ emoji: e.target.value })} placeholder="İkon (emoji)" className={inputClass} />
          <input type="number" min="0" value={form.k_value} onChange={(e) => set({ k_value: e.target.value })} placeholder="K fiyatı" className={inputClass} />
        </div>
        <input value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Kategori (örn: Lüks)" className={inputClass} />
        <input type="number" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} placeholder="Sıra" className={inputClass} />

        <div className="flex items-center gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold">
            <Upload className="h-4 w-4" /> {uploading ? 'Yükleniyor…' : 'Görsel yükle'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {form.image_url && (
            <button type="button" onClick={() => set({ image_url: '' })} className="rounded-lg bg-secondary px-2 py-2 text-xs font-semibold">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {form.image_url && <Image src={form.image_url} alt="Önizleme" className="h-16 w-16 rounded-lg" fittingType="fit" originWidth={128} originHeight={128} />}

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

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz hediye eklenmedi.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((gift) => {
            const color = toneColor(tierForK(tiers, gift.k_value));
            return (
              <div key={gift.id} className="rounded-2xl border border-border bg-card p-3" style={{ borderColor: gift.active === false ? undefined : color }}>
                <div className="flex items-center gap-3">
                  {gift.image_url ? (
                    <Image src={gift.image_url} alt={gift.name} className="h-12 w-12 rounded-lg" fittingType="fit" originWidth={96} originHeight={96} />
                  ) : (
                    <span className="text-3xl leading-none">{gift.emoji || '🎁'}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{gift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatK(gift.k_value)} • {gift.category || 'Diğer'} • sıra {Number(gift.sort_order) || 0}
                    </p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: `${color}22`, color }}>
                    {gift.active === false ? 'PASİF' : 'AKTİF'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <button type="button" onClick={() => startEdit(gift)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => move(gift, -1)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => move(gift, 1)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => toggleActive(gift)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold">
                    {gift.active === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  {confirmId === gift.id ? (
                    <span className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => remove(gift)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white">Sil</button>
                      <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold">Vazgeç</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(gift.id)} className="ml-auto rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}