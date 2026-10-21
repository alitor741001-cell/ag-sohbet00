import { Coins } from 'lucide-react';

/** "Hesaplı Al, Daha Fazla Keyif Al!" bilgi kutusu. */
export default function CoinShopInfoBox() {
  return (
    <div
      className="mt-3 flex items-start gap-3 rounded-2xl px-3.5 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(232,185,90,0.14) 0%, rgba(10,18,30,0.9) 46%, rgba(6,10,18,0.92) 100%)',
        border: '1px solid rgba(232,185,90,0.35)',
        boxShadow: 'inset 0 1px 0 rgba(255,246,214,0.12)',
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 30%, #fff2c4, #e0b73f 58%, #8a6a1c 100%)', boxShadow: '0 0 14px rgba(232,185,90,0.45)' }}
      >
        <Coins className="h-5 w-5 text-[#2b1602]" strokeWidth={2.6} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-white">Hesaplı Al, Daha Fazla Keyif Al!</p>
        <p className="mt-1 text-[11px] leading-snug text-white/70">
          Dilediğin miktarda coins alarak, platformdaki özel içeriklere, hediyelere ve daha fazlasına ulaşabilirsin.
        </p>
      </div>
    </div>
  );
}