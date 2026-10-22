import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CosmeticCard from '@/components/store/CosmeticCard';
import useCosmeticStore from '@/hooks/useCosmeticStore';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import { useCurrentUser } from '@/lib/useCurrentUser';
export default function StoreCatalog({ onInventory, onCoins }) {
  const category = 'seat-frame'; const [confirm, setConfirm] = useState(null); const [notice, setNotice] = useState('');
  const store = useCosmeticStore('catalog', category); const request = useRef({}); const { user } = useCurrentUser();
  const [liveCoins, setLiveCoins] = useState(null); useWalletCoinsLive(user?.id, setLiveCoins);
  const buy = async () => {
    if (!confirm) return;
    const key = `ag-cosmetic-buy:${user.id}:${confirm.id}`;
    request.current[confirm.id] ||= sessionStorage.getItem(key) || crypto.randomUUID();
    sessionStorage.setItem(key, request.current[confirm.id]);
    if (await store.mutate('buy', { product_id: confirm.id, request_id: request.current[confirm.id] })) { sessionStorage.removeItem(key); setLiveCoins(null); setNotice('Çerçeve kalıcı olarak Çerçevelerim alanına eklendi.'); }
  };
  return <section className="text-cabinet-ink">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-cabinet-gold">{(liveCoins ?? store.coins)?.toLocaleString('tr-TR') ?? '—'} Coins</p><div className="flex gap-3"><button className="text-xs underline" type="button" onClick={onInventory}>Çerçevelerim</button>{onCoins && <button className="text-xs underline" type="button" onClick={onCoins}>Coins yükle</button>}</div></div>
    <h2 className="mb-1 text-lg font-black text-cabinet-gold">Animasyonlu Çerçeveler</h2>
    <p className="mb-4 text-xs leading-relaxed text-cabinet-ink/80">Ejderha, alev, kelebek, çiçek, yarım çember ve dönen yıldız koleksiyonu. Satın aldıkların Çanta → Çerçevelerim alanına eklenir.</p>
    {store.loading && !store.items.length ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : <div className="grid grid-cols-2 gap-3">{store.items.map(item => <CosmeticCard key={item.id} item={item} busy={store.busy} owned={store.owned_ids.includes(item.id)} vipLevel={store.vip_level} onBuy={item => { setConfirm(item); setNotice(''); }} />)}</div>}
    {!store.loading && !store.items.length && <p className="py-8 text-center text-sm">Bu kategoride henüz ürün yok.</p>}
    {store.has_more && <button disabled={store.loading} type="button" onClick={() => store.load(store.next_cursor)} className="mt-4 min-h-11 w-full rounded-xl border border-cabinet-gold/40">Daha fazla göster</button>}
    {store.error && <p role="alert" className="mt-3 text-sm text-destructive">{store.error} <button type="button" onClick={() => store.load()} className="underline">Yenile</button></p>}
    {notice && <p role="status" className="mt-3 text-sm text-cabinet-gold">{notice} <button type="button" onClick={onInventory} className="underline">Çerçevelerimi aç</button></p>}
    <ConfirmDialog open={!!confirm} onOpenChange={open => { if (!open) setConfirm(null); }} title={confirm?.name || 'Çerçeve satın al'} description={`${confirm?.price?.toLocaleString('tr-TR')} Coins bakiyenden düşülür. Ürün süresizdir ve yalnızca koltukta görünür.`} confirmText="Coins ile Satın Al" onConfirm={buy} />
  </section>;
}