import React from 'react';
import { Coins, Minus, Play, Plus, RotateCw, Ticket } from 'lucide-react';
import LuckyMultipliers from './LuckyMultipliers';
import { formatCoins, shortCoins } from './luckyConfig';

/** Alt kontrol paneli: satın al, DÖNDÜR, çarpan birikimi ve bahis satırı. */
export default function LuckyControls({
  bet,
  coins,
  buyCost,
  spinning,
  auto,
  busy,
  banner,
  multipliers,
  merged,
  onSpin,
  onBuy,
  onShiftBet,
  onMax,
  onToggleAuto,
}) {
  const poor = coins < buyCost;
  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 px-2 pb-2 pt-1.5">
      <div className="slot-panel-3d flex items-center justify-center rounded-md border border-slot-gold/40 px-3 py-1">
        <span className="truncate text-[0.72rem] font-black tracking-wide text-slot-gold">{banner}</span>
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={onBuy}
          disabled={spinning || busy || poor}
          className="slot-panel-3d flex w-[27%] flex-col items-center justify-center gap-0.5 rounded-xl border border-slot-gold/60 bg-slot-red/25 px-1 py-1.5 text-center disabled:opacity-45"
        >
          <Ticket className="h-4 w-4 text-slot-gold" />
          <span className="text-[0.55rem] font-black leading-tight text-slot-gold">Ücretsiz Döndürme Satın Al</span>
          <span className="text-[0.7rem] font-black text-white">{shortCoins(buyCost)}</span>
        </button>

        <button
          type="button"
          onClick={onSpin}
          disabled={spinning || busy}
          className="slot-spin flex flex-1 flex-col items-center justify-center rounded-full px-2 py-1.5 disabled:opacity-60"
        >
          <Play className="h-6 w-6 text-slot-bg" />
          <span className="text-sm font-black tracking-widest text-slot-bg">{spinning ? 'DÖNÜYOR' : 'DÖNDÜR'}</span>
        </button>

        <div className="w-[29%]">
          <LuckyMultipliers multipliers={multipliers} merged={merged} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleAuto}
          className={`slot-auto flex h-8 items-center gap-1 rounded-lg px-2 text-[0.6rem] font-black ${auto ? 'ring-2 ring-slot-green' : ''}`}
        >
          <RotateCw className="h-3.5 w-3.5" /> Otomatik
        </button>
        <button
          type="button"
          onClick={() => onShiftBet(-1)}
          disabled={spinning}
          aria-label="Bahsi azalt"
          className="slot-step flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-45"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="slot-panel-3d flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-slot-gold/40 px-2 py-1">
          <Coins className="h-4 w-4 shrink-0 text-slot-blue" />
          <span className="slot-digits truncate text-sm font-black text-white">{formatCoins(bet)}</span>
          <span className="hidden shrink-0 text-[0.5rem] font-black text-slot-gold sm:inline">TOTAL BET</span>
        </div>
        <button
          type="button"
          onClick={() => onShiftBet(1)}
          disabled={spinning}
          aria-label="Bahsi artır"
          className="slot-step flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-45"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onMax}
          disabled={spinning}
          className="slot-max flex h-8 items-center rounded-lg px-2 text-[0.6rem] font-black disabled:opacity-45"
        >
          MAX
        </button>
      </div>
    </div>
  );
}