import React from 'react';
import { Coins, Minus, Plus } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function BetControls({ bet, coins, bonusReady, bonusAmount, onBet, onMax, onBonus }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onBet(-1)}
          aria-label="Bahsi azalt"
          className="slot-auto flex h-9 w-9 items-center justify-center rounded-lg text-slot"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="slot-metal min-w-[5.5rem] rounded-lg px-2 py-1 text-center">
          <p className="text-[9px] font-black tracking-widest text-slot-gold">BET</p>
          <p className="font-mono text-sm font-black tabular-nums text-slot-text">{format(bet)}</p>
        </div>
        <button
          type="button"
          onClick={() => onBet(1)}
          aria-label="Bahsi artır"
          className="slot-auto flex h-9 w-9 items-center justify-center rounded-lg text-slot"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onMax}
        className="slot-auto h-9 flex-1 rounded-lg text-[11px] font-black tracking-widest text-slot"
      >
        MAX
      </button>

      <button
        type="button"
        onClick={onBonus}
        title={`Bonus: ${format(bonusAmount)}`}
        aria-label="Coin bonusu al"
        className="slot-metal flex h-9 items-center gap-1 rounded-lg px-2"
      >
        <Coins className="h-4 w-4 text-slot-gold" />
        <span className="font-mono text-[11px] font-black tabular-nums text-slot-text">{format(coins)}</span>
        <span className={`text-sm font-black ${bonusReady ? 'text-slot-green' : 'text-slot-gold/40'}`}>+</span>
      </button>
    </div>
  );
}