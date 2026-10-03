import React from 'react';
import { Coins, Minus, Play, Plus, RotateCw, Ticket } from 'lucide-react';
import { BANNER_BOX, BET_ROW, BUY_BOX, SPIN_BOX, boxStyle } from './luckyLayout';
import { formatCoins, shortCoins } from './luckyConfig';

/** Görselin kontrol paneli: durum şeridi, satın al, SPIN ve bahis satırı. */
export default function LuckyPanel({
  bet,
  coins,
  buyCost,
  spinning,
  auto,
  busy,
  banner,
  onSpin,
  onBuy,
  onShiftBet,
  onMax,
  onToggleAuto,
}) {
  const poor = coins < buyCost;
  return (
    <>
      <div
        className="absolute flex items-center justify-center rounded-md border border-slot-gold/45 bg-black/70 px-2"
        style={boxStyle(BANNER_BOX)}
      >
        <span className="truncate text-[min(3.2vw,0.75rem)] font-black tracking-wide text-slot-gold">{banner}</span>
      </div>

      <button
        type="button"
        onClick={onBuy}
        disabled={spinning || busy || poor}
        className="lucky-buy absolute flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center disabled:opacity-45"
        style={boxStyle(BUY_BOX)}
      >
        <span className="flex items-center gap-1 text-[min(2.6vw,0.58rem)] font-black leading-tight text-slot-gold">
          <Ticket className="h-[0.9em] w-[0.9em] shrink-0" />
          Ücretsiz Döndürme Satın Al
        </span>
        <span className="text-[min(3.2vw,0.75rem)] font-black text-white">{shortCoins(buyCost)}</span>
      </button>

      <button
        type="button"
        onClick={onSpin}
        disabled={spinning || busy}
        className="lucky-spin absolute flex flex-col items-center justify-center rounded-full disabled:opacity-60"
        style={boxStyle(SPIN_BOX)}
      >
        <Play className="h-[34%] w-[34%] text-slot-gold" />
        <span className="text-[min(3.4vw,0.8rem)] font-black tracking-widest text-slot-gold">
          {spinning ? 'DÖNÜYOR' : 'SPIN'}
        </span>
      </button>

      <div className="absolute flex items-center gap-1.5" style={boxStyle(BET_ROW)}>
        <button
          type="button"
          onClick={onToggleAuto}
          className={`slot-auto flex h-full items-center gap-1 rounded-lg px-2 text-[min(2.8vw,0.68rem)] font-black ${auto ? 'ring-2 ring-slot-green' : ''}`}
        >
          <RotateCw className="h-[1.1em] w-[1.1em]" /> Otomatik
        </button>

        <button
          type="button"
          onClick={() => onShiftBet(-1)}
          disabled={spinning}
          aria-label="Bahsi azalt"
          className="slot-step flex h-full w-[9%] items-center justify-center rounded-lg disabled:opacity-45"
        >
          <Minus className="h-[1.2em] w-[1.2em]" />
        </button>

        <div className="slot-panel-3d flex h-full min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-slot-gold/40 px-2">
          <Coins className="h-[1.2em] w-[1.2em] shrink-0 text-slot-blue" />
          <span className="slot-digits truncate text-[min(3.4vw,0.85rem)] font-black text-white">{formatCoins(bet)}</span>
          <span className="shrink-0 text-[min(2.4vw,0.5rem)] font-black text-slot-gold">TOTAL BET</span>
        </div>

        <button
          type="button"
          onClick={() => onShiftBet(1)}
          disabled={spinning}
          aria-label="Bahsi artır"
          className="slot-step flex h-full w-[9%] items-center justify-center rounded-lg disabled:opacity-45"
        >
          <Plus className="h-[1.2em] w-[1.2em]" />
        </button>

        <button
          type="button"
          onClick={onMax}
          disabled={spinning}
          className="slot-max flex h-full items-center rounded-lg px-3 text-[min(2.8vw,0.68rem)] font-black disabled:opacity-45"
        >
          MAX
        </button>
      </div>
    </>
  );
}