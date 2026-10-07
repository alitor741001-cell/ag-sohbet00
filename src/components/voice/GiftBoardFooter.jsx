import { ChevronRight, Coins } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';

/** Hediye Tahtası alt çubuğu: bakiye kutusu (dokununca coin mağazası) ve Gönder düğmesi. */
export default function GiftBoardFooter({ coins, count = 0, onOpenCoins, onSend, sendDisabled }) {
  return (
    <footer className="mt-2 flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur">
      <button
        type="button"
        onClick={onOpenCoins}
        className="flex min-w-0 shrink items-center gap-1 rounded-xl bg-black/40 px-2 py-1.5 text-xs font-black tabular-nums text-white transition-transform active:scale-95"
      >
        <Coins className="h-4 w-4 shrink-0 text-[#fbc02d]" />
        <span className="truncate">{coins === null || coins === undefined ? '—' : formatCoins(coins)}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/50" />
      </button>

      <button
        type="button"
        onClick={onSend}
        disabled={sendDisabled}
        className="ml-auto shrink-0 rounded-xl bg-gradient-to-r from-[#6af5d9] to-[#4adec9] px-4 py-2 text-sm font-black text-[#0d2b28] transition-transform active:scale-95 disabled:opacity-40"
      >
        Gönder{count > 0 ? ` · ${count}` : ''}
      </button>
    </footer>
  );
}