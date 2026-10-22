import { useState } from 'react';
import useCosmeticStore from '@/hooks/useCosmeticStore';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import CosmeticProductForm from '@/components/admin/store/CosmeticProductForm';
import VideoProduction from '@/components/admin/store/VideoProduction';
export default function AdminCosmeticCatalog() {
  const store = useCosmeticStore('admin-list'); const [editing, setEditing] = useState(null); const [video, setVideo] = useState(null);
  const save = async product => { if (await store.mutate('admin-save', { id: editing?.id, product })) setEditing(null); };
  return <div className="mt-4 space-y-4 text-cabinet-ink">
    <p className="text-xs text-cabinet-ink/70">Mağaza çerçeveleri süresizdir ve yalnızca koltukta gösterilir. Giriş efektleri VIP 5–12 ortak havuzundadır. Yayından kaldırılan satın alınmış ürünler envanterde kalır.</p>
    <button type="button" onClick={() => setEditing({ fresh: true })} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Yeni ürün / efekt ekle</button>
    {editing && <CosmeticProductForm key={editing.id || 'new'} item={editing.fresh ? null : editing} busy={store.busy} onSave={save} onCancel={() => setEditing(null)} />}
    {store.loading && !store.items.length && <p role="status">Yükleniyor…</p>}
    {!store.loading && !store.items.length && <p>Henüz ürün yok.</p>}
    <div className="grid grid-cols-2 gap-3">{store.items.map(item => <article key={item.id} className="rounded-xl border border-cabinet-gold/25 bg-cabinet p-3"><CosmeticArtwork product={item} className="mx-auto h-24 w-full object-contain" /><h3 className="mt-2 text-xs font-bold">{item.name}</h3><p className="mt-1 text-xs text-cabinet-gold">{item.category==='entrance' ? 'VIP 5–12 ortak giriş' : `${item.price.toLocaleString('tr-TR')} Coins`}</p><p className="mt-1 text-[10px]">{item.published ? 'Yayında' : 'Yayında değil'}</p><button type="button" onClick={() => setEditing(item)} className="mt-2 min-h-11 w-full rounded-xl border border-cabinet-light/40 text-xs">Düzenle</button>{item.category==='entrance' && <button type="button" onClick={() => setVideo(item)} className="mt-2 min-h-11 w-full rounded-xl border border-cabinet-gold/40 text-xs">{item.video_url ? 'Videoyu yönet' : 'Gerçek video üret'}</button>}</article>)}</div>
    {store.has_more && <button type="button" disabled={store.loading} onClick={() => store.load(store.next_cursor)} className="min-h-11 w-full rounded-xl border border-cabinet-light/40">Daha fazla göster</button>}
    {store.error && <p role="alert" className="text-sm text-destructive">{store.error} <button type="button" className="underline" onClick={() => store.load()}>Yenile</button></p>}
    {video && <VideoProduction key={video.id} product={video} onClose={() => { setVideo(null); store.load(); }} />}
  </div>;
}