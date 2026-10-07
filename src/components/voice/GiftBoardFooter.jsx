import { useState } from 'react';
import { ChevronRight, ChevronUp, Coins } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';

// Gönderim adedi seçenekleri (sunucu en fazla 10 kabul eder).
const QUANTITIES = [1, 2, 5, 10];

/** Hediye Tahtası alt çubuğu: bakiye kutusu (dokununca coin mağazası), gönderim adedi ve Gönder düğmesi. */
export default function GiftBoardFooter({ coins, multiplier = 1, onMultiplier, onOpenCoins, onSend, sendDisabled }) {
  const [openQty, setOpenQty] = useState(false);
  const quantity = Math.max(1, Number(multiplier) || 1);

  return (
    <footer className="relative mt-2 shrink-0">
      {/* Adet seçenekleri çubuğun üstüne doğru açılır. */}
      {openQty && (
        <div className="absolute bottom-[calc(100%+0.4rem)] right-0 z-10 flex gap-1 rounded-2xl border border-white/10 bg-[#1a1226]/95 p-1 backdrop-blur">
          {QUANTITIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => { onMultiplier?.(value); setOpenQty(false); }}
              className={`h-8 min-w-[38px] rounded-xl text-xs font-black tabular-nums transition-colors ${quantity === value ? 'bg-[#45d6c8] text-[#0d2b28]' : 'text-white/70'}`}
            >
              x{value}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur">
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
          onClick={() => setOpenQty((value) => !value)}
          aria-label={`Gönderim adedi ${quantity}`}
          className="flex shrink-0 items-center gap-0.5 rounded-xl bg-black/40 px-2 py-1.5 text-xs font-black tabular-nums text-white transition-transform active:scale-95"
        >
          {quantity}
          <ChevronUp className="h-3.5 w-3.5 text-white/60" />
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled}
          className="ml-auto shrink-0 rounded-xl bg-gradient-to-r from-[#6af5d9] to-[#4adec9] px-4 py-2 text-sm font-black text-[#0d2b28] transition-transform active:scale-95 disabled:opacity-40"
        >
          Gönder
        </button>
      </div>
    </footer>
  );
}