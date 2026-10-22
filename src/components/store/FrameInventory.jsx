import { Loader2 } from 'lucide-react';
import useCosmeticStore from '@/hooks/useCosmeticStore';
import CosmeticCard from '@/components/store/CosmeticCard';
export default function FrameInventory({ onShop }) {
  const store = useCosmeticStore('inventory');
  return <section className="text-cabinet-ink">
    <h2 className="text-lg font-black text-cabinet-gold">Çerçevelerim</h2>
    <p className="mb-4 mt-1 text-xs text-cabinet-ink/70">Seçimin kalıcıdır; çerçeve yalnızca gerçek bir koltukta otururken görünür. Kaldırmak ürünü silmez.</p>
    {store.loading && !store.items.length ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : <div className="grid grid-cols-2 gap-3">{store.items.map(item => <CosmeticCard key={item.id} item={item} inventory active={store.selection.seat_product_id === item.product_id} busy={store.busy} onEquip={product_id => store.mutate('equip', { product_id })} />)}</div>}
    {!store.loading && !store.items.length && <div className="py-8 text-center"><p className="text-sm">Henüz satın aldığın koltuk çerçevesi yok.</p><button type="button" onClick={onShop} className="mt-3 min-h-11 rounded-xl bg-primary px-4 font-bold text-primary-foreground">Mağazayı aç</button></div>}
    {store.has_more && <button type="button" disabled={store.loading} onClick={() => store.load(store.next_cursor)} className="mt-4 min-h-11 w-full rounded-xl border border-cabinet-gold/40">Daha fazla göster</button>}
    {store.error && <p role="alert" className="mt-3 text-sm text-destructive">{store.error} <button type="button" onClick={() => store.load()} className="underline">Yenile</button></p>}
  </section>;
}