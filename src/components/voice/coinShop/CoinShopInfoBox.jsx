import { Coins } from 'lucide-react';

/** "Hesaplı Al, Daha Fazla Keyif Al!" bilgi kutusu. */
export default function CoinShopInfoBox() {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#E8B95A] bg-[#0d1424] px-3.5 py-3">
      <Coins className="mt-0.5 h-7 w-7 shrink-0 text-[#E8B95A]" />
      <div className="min-w-0">
        <p className="text-sm font-black text-white">Hesaplı Al, Daha Fazla Keyif Al!</p>
        <p className="mt-1 text-[11px] leading-snug text-white/70">
          Dilediğin miktarda coins alarak, platformdaki özel içeriklere, hediyelere ve daha fazlasına ulaşabilirsin.
        </p>
      </div>
    </div>
  );
}