import { ChevronRight, Coins, Gem } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';

/**
 * Profil menüsündeki cüzdan kartları: solda yüklenen coinler,
 * sağda hediyelerden biriken elmas (hediye kutusu) değeri.
 */
export default function ProfileWalletCards({ coins, giftScore, onOpenGiftBox, onOpenCoins }) {
  const coinText = coins === null || coins === undefined ? '—' : formatCoins(coins);
  const giftText = giftScore === null || giftScore === undefined ? '—' : formatScore(giftScore);

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-white/10 px-3 py-3">
      <button
        type="button"
        onClick={onOpenCoins}
        className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm transition-transform active:scale-95"
      >
        <Coins className="h-6 w-6 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold tabular-nums text-[#1F2024]">{coinText}</p>
          <p className="text-[10px] font-semibold text-[#6b7280]">Coins</p>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenGiftBox}
        className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm transition-transform active:scale-95"
      >
        <Gem className="h-6 w-6 shrink-0 text-sky-400" />
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold tabular-nums text-[#1F2024]">{giftText}</p>
          <p className="text-[10px] font-semibold text-[#6b7280]">Elmaslar</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#c4c9d0]" />
      </button>
    </div>
  );
}