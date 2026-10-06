import { Crown, Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { CHEST_IMAGE_URL } from '@/components/voice/coinShop/coinShopAssets';

/** Coin mağazası üst bölümü: başlık, çağrı metinleri ve altın sandık görseli. */
export default function CoinShopHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E8B95A]/25 bg-[#080d16] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-2xl font-black tracking-tight text-white">Coin Mağazası</span>
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-[#E8B95A] to-[#C5963B]">
              <Crown className="absolute -top-4 h-4 w-4 text-[#E8B95A]" />
              <Play className="h-4 w-4 fill-black text-black" />
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/85">Daha fazlası için coins yükle</p>
          <p className="mt-1 text-sm font-bold italic text-[#E8B95A]">Keyfin Hiç Bitmesin!</p>
        </div>
        <span className="relative h-24 w-24 shrink-0">
          <span className="absolute inset-0 rounded-full bg-[#E8B95A]/25 blur-2xl" />
          <Image src={CHEST_IMAGE_URL} alt="Altın sandık" className="relative h-full w-full" fittingType="fill" draggable={false} />
        </span>
      </div>
    </div>
  );
}