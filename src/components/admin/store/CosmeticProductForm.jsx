import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CosmeticMediaField from '@/components/store/CosmeticMediaField';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
const EMPTY = { name: '', category: 'seat-frame', price: 20000, min_vip: 0, image_url: '', video_url: '', published: false, remove_white: false, sort_order: 0 };
export default function CosmeticProductForm({ item, busy, onSave, onCancel }) {
  const [product, setProduct] = useState(item || EMPTY);
  const field = (name, value) => setProduct(old => ({ ...old, [name]: value }));
  return <form onSubmit={e => { e.preventDefault(); onSave(product); }} className="space-y-4 rounded-2xl border border-cabinet-gold/40 bg-cabinet p-4 text-cabinet-ink">
    <h3 className="font-black text-cabinet-gold">{item ? 'Ürünü / efekti düzenle' : 'Yeni ürün / giriş efekti'}</h3>
    <label className="block text-xs">Ad<input required maxLength={80} value={product.name} onChange={e => field('name',e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-cabinet-light/30 bg-cabinet-surface/30 px-3" /></label>
    <label className="block text-xs">Kategori<Select disabled={!!item} value={product.category} onValueChange={v => setProduct(old => ({...old, category:v, min_vip: v==='entrance' ? 5 : old.min_vip, price:v==='entrance' ? 0 : old.price || 20000}))}><SelectTrigger className="mt-2 min-h-11"><SelectValue /></SelectTrigger><SelectContent className="z-[550]"><SelectItem value="seat-frame">Özel Koltuk Çerçeveleri</SelectItem><SelectItem value="vip-frame">VIP Çerçeveleri</SelectItem><SelectItem value="entrance">VIP 5–12 Ortak Giriş Efektleri</SelectItem></SelectContent></Select></label>
    <div className="grid grid-cols-2 gap-3"><label className="text-xs">Coins fiyatı<input type="number" min={product.category==='entrance' ? 0 : 1} max={1000000000} step="1" required disabled={product.category==='entrance'} value={product.price} onChange={e => field('price',Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-cabinet-light/30 bg-cabinet-surface/30 px-3" /></label><label className="text-xs">Gerekli VIP{product.category==='entrance' ? <p className="mt-2 py-3">VIP 5–12 ortak havuzu</p> : <Select value={String(product.min_vip)} onValueChange={v => field('min_vip',Number(v))}><SelectTrigger className="mt-2 min-h-11"><SelectValue /></SelectTrigger><SelectContent className="z-[550]">{[0,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={String(n)}>{n ? `VIP ${n}` : 'Herkes'}</SelectItem>)}</SelectContent></Select>}</label></div>
    <CosmeticMediaField label="Orijinal görsel" value={product.image_url} onChange={v => setProduct(old => ({...old, image_url:v, crop:{}}))} />
    {product.image_url && <CosmeticArtwork product={product} className="mx-auto h-32 w-32 object-contain" />}
    {product.category==='entrance' && <CosmeticMediaField label="Giriş videosu (isteğe bağlı)" value={product.video_url} video onChange={v => field('video_url',v)} />}
    {product.category!=='entrance' && <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={!!product.remove_white} onChange={e => field('remove_white',e.target.checked)} /> Beyaz arka planı saydamlaştır (orijinal renkleri değiştirmez)</label>}
    <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={product.published} onChange={e => field('published',e.target.checked)} /> Yayında / satışta</label>
    <div className="flex gap-2"><button type="submit" disabled={busy} className="min-h-11 flex-1 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 flex-1 rounded-xl border border-cabinet-gold/40">Vazgeç</button></div>
  </form>;
}