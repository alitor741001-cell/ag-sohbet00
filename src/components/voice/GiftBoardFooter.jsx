import { ChevronRight, Coins, Crown, Send } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';

/** Hediye Tahtası alt çubuğu: bakiye kutusu (dokununca coin mağazası) ve Gönder düğmesi. */
export default function GiftBoardFooter({ coins, count = 0, onOpenCoins, onSend, sendDisabled }) {
  return (
    <footer className="gift-palace-footer mt-3 flex shrink-0 items-center gap-2">
      <span className="gift-palace-footer-ribbon" aria-hidden="true" />
      <Crown className="gift-palace-crown" aria-hidden="true" />
      <button
        type="button"
        onClick={onOpenCoins}
        className="gift-palace-wallet flex min-w-0 shrink items-center gap-1 text-sm font-black tabular-nums transition-transform active:scale-95"
      >
        <span className="gift-palace-coin-stack" aria-hidden="true"><Coins /><Coins /><Coins /></span>
        <span className="truncate">{coins === null || coins === undefined ? '—' : formatCoins(coins)}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/50" />
      </button>

      <button
        type="button"
        onClick={onSend}
        disabled={sendDisabled}
        className="gift-palace-send ml-auto flex shrink-0 items-center justify-center gap-2 text-sm font-black transition-transform active:scale-95 disabled:opacity-40"
      >
        <Send className="h-4 w-4" fill="currentColor" /> Gönder{count > 1 ? ` · ${count}` : ''}
      </button>
    </footer>
  );
}