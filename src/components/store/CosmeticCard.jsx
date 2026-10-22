import { Check, Coins, Lock } from 'lucide-react';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
export default function CosmeticCard({ item, owned, active, inventory, busy, vipLevel = 0, onBuy, onEquip }) {
  const locked = !owned && (item.min_vip || 0) > vipLevel;
  return <article className="cabinet-product flex flex-col rounded-2xl border border-cabinet-gold/30 bg-cabinet/60 p-3 text-cabinet-ink">
    <CosmeticArtwork product={item} className="mx-auto aspect-square w-full max-w-40 object-contain" />
    <h3 className="mt-2 text-center text-sm font-bold">{item.name}</h3>
    <p className="mt-1 text-center text-[10px] text-cabinet-ink/65">Süresiz · yalnızca koltukta</p>
    {item.min_vip > 0 && <p className="mt-1 text-center text-xs text-cabinet-gold">VIP {item.min_vip} gerekli</p>}
    {inventory ? <div className="mt-auto pt-3">
      <button disabled={busy} type="button" onClick={() => onEquip(active ? '' : item.product_id)} className="min-h-11 w-full rounded-xl border border-cabinet-gold/50 bg-cabinet-light/20 px-2 text-xs font-bold disabled:opacity-50">{active ? 'Kaldır' : 'Kullan'}</button>
      {active && <p className="mt-2 flex items-center justify-center gap-1 text-xs text-cabinet-gold"><Check className="h-3 w-3" /> Kullanılıyor</p>}
    </div> : <div className="mt-auto pt-3">
      <p className="mb-2 flex items-center justify-center gap-1 text-sm font-black text-cabinet-gold"><Coins className="h-4 w-4" /> {item.price.toLocaleString('tr-TR')}</p>
      <button disabled={busy || owned || locked} type="button" onClick={() => onBuy(item)} className="flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-primary px-2 text-xs font-bold text-primary-foreground disabled:opacity-55">{owned ? <><Check className="h-4 w-4" /> Sahipsin</> : locked ? <><Lock className="h-4 w-4" /> VIP gerekli</> : 'Coins ile Satın Al'}</button>
    </div>}
  </article>;
}