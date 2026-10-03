import React from 'react';
import { Film } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotActionDeck({ coins, spinning, disabled, onCoin, onMax, onSpin }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onCoin}
        aria-label="Coin ekle"
        className="slot-panel-3d flex h-12 shrink-0 items-center gap-1 rounded-xl border border-slot-gold/50 px-2"
      >
        <span className="text-base leading-none">🪙</span>
        <span className="slot-digits font-mono text-[11px] font-black tabular-nums text-white">{format(coins)}</span>
        <span className="slot-coin-plus flex h-5 w-5 items-center justify-center rounded-full text-sm font-black">+</span>
      </button>

      <button
        type="button"
        onClick={onMax}
        aria-label="Maksimum bahsi seç"
        className="slot-max h-12 flex-1 rounded-xl text-xs font-black tracking-widest text-white"
      >
        MAX
      </button>

      <button
        type="button"
        onClick={onSpin}
        disabled={disabled || spinning}
        aria-label="Turu başlat"
        className="slot-spin flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full text-slot disabled:opacity-60"
      >
        <Film className={`h-7 w-7 ${spinning ? 'animate-spin' : ''}`} />
        <span className="text-xs font-black tracking-widest">SPIN</span>
      </button>
    </div>
  );
}