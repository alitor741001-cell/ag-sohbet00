import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { COIN_STACK_IMAGE_URL, stackSize } from '@/components/voice/coinShop/coinShopAssets';
import { formatCoins } from '@/lib/giftTone';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Tek coin paketi kartı: miktar, adet seçimi (sepet gibi), toplam tutar ve Satın Al. */
export default function CoinPackageCard({ pack, qty = 1, onQty, onBuy }) {
  const total = (Number(pack.price) || 0) * qty;
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#E8B95A]/35 bg-[#0f172a] p-2 text-center">
      <p className="text-[13px] font-black leading-none tabular-nums text-white">{formatCoins(pack.coins)}</p>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/70">Coins</p>
      <span className="my-1.5 flex h-[68px] w-full items-center justify-center rounded-lg bg-[#05070a]">
        <Image src={COIN_STACK_IMAGE_URL} alt="Altın coin yığını" className={stackSize(pack.coins)} fittingType="fill" draggable={false} />
      </span>
      {/* Adet seçimi: aynı paketten birden fazla alınabilir (örn. 6 × 50.000 Coins). */}
      <div className="flex w-full items-center justify-between gap-1 rounded-lg border border-[#E8B95A]/30 bg-[#05070a] p-1">
        <button
          type="button"
          onClick={() => onQty?.(qty - 1)}
          disabled={qty <= 1}
          aria-label="Adet azalt"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition-transform active:scale-95 disabled:opacity-35"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-0 flex-1 text-[11px] font-black tabular-nums text-white">{qty} adet</span>
        <button
          type="button"
          onClick={() => onQty?.(qty + 1)}
          aria-label="Adet artır"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition-transform active:scale-95"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="mt-1.5 text-base font-black tabular-nums leading-none text-white">{formatTl(total)}</p>
      {qty > 1 && (
        <p className="mt-0.5 text-[10px] font-bold tabular-nums text-[#E8B95A]">
          {formatCoins(pack.coins)} × {qty} = {formatCoins(pack.coins * qty)}
        </p>
      )}
      <button
        type="button"
        onClick={() => onBuy(pack)}
        className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#E8B95A] to-[#C5963B] text-[11px] font-black text-black transition-transform active:scale-95"
      >
        <ShoppingCart className="h-3.5 w-3.5" /> Satın Al
      </button>
    </div>
  );
}