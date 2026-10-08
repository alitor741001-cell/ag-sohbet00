import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { COIN_STACK_IMAGE_URL, stackSize } from '@/components/voice/coinShop/coinShopAssets';
import { formatCoins } from '@/lib/giftTone';
import '@/styles/gameCards.css';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Tek coin paketi kartı: siyah parlak zemin, çift altın çerçeve; miktar, adet seçimi ve Satın Al. */
export default function CoinPackageCard({ pack, qty = 1, onQty, onBuy }) {
  const total = (Number(pack.price) || 0) * qty;
  return (
    <div className="gd-deal">
      <p className="text-[13px] font-black leading-none tabular-nums text-[#ffd35c]">{formatCoins(pack.coins)}</p>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#ffd35c]/70">Coins</p>
      <span className="gd-deal-well">
        <Image src={COIN_STACK_IMAGE_URL} alt="Altın coin yığını" className={stackSize(pack.coins)} fittingType="fill" draggable={false} />
      </span>
      {/* Adet seçimi: aynı paketten birden fazla alınabilir (örn. 6 × 50.000 Coins). */}
      <div className="gd-deal-qty">
        <button
          type="button"
          onClick={() => onQty?.(qty - 1)}
          disabled={qty <= 1}
          aria-label="Adet azalt"
          className="gd-deal-step"
        >
          <Minus className="h-3 w-3" strokeWidth={3} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[11px] font-black tabular-nums text-[#fff6dd]">{qty} adet</span>
        <button
          type="button"
          onClick={() => onQty?.(qty + 1)}
          aria-label="Adet artır"
          className="gd-deal-step"
        >
          <Plus className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
      <p className="mt-1 text-base font-black leading-none tabular-nums text-[#fff6dd]">{formatTl(total)}</p>
      {qty > 1 && (
        <p className="text-[10px] font-bold tabular-nums text-[#ffd35c]">
          {formatCoins(pack.coins)} × {qty} = {formatCoins(pack.coins * qty)}
        </p>
      )}
      <button type="button" onClick={() => onBuy(pack)} className="gd-deal-buy mt-1.5">
        <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.6} /> Satın Al
      </button>
    </div>
  );
}