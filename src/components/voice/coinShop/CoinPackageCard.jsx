import { ShoppingCart } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { COIN_STACK_IMAGE_URL, stackSize } from '@/components/voice/coinShop/coinShopAssets';
import { formatCoins } from '@/lib/giftTone';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Tek coin paketi kartı: miktar, altın yığını, fiyat ve Satın Al (ödeme sayfasını açar). */
export default function CoinPackageCard({ pack, onBuy }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#E8B95A]/35 bg-[#0f172a] p-2 text-center">
      <p className="text-[13px] font-black leading-none tabular-nums text-white">{formatCoins(pack.coins)}</p>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/70">Coins</p>
      <span className="my-1.5 flex h-[68px] w-full items-center justify-center rounded-lg bg-[#05070a]">
        <Image src={COIN_STACK_IMAGE_URL} alt="Altın coin yığını" className={stackSize(pack.coins)} fittingType="fill" draggable={false} />
      </span>
      <p className="text-base font-black tabular-nums leading-none text-white">{formatTl(pack.price)}</p>
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