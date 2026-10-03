import React from 'react';
import { Minus, Plus } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function StepKey({ icon: Icon, label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white active:brightness-125 disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Görselin altında kalan ince canlı kontrol şeridi: bakiye, kazanç, bahis, MAX, AUTO. */
export default function SlotControlStrip({ coins, unlimited, win, bet, auto, spinning, disabled, onCoin, onBet, onAuto, onMax }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-white/10 bg-black/70 px-2 py-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={onCoin}
        aria-label="Coin yükle"
        className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white/10 px-2 active:brightness-125"
      >
        <span className="text-sm leading-none">🪙</span>
        <span className="font-mono text-[11px] font-black tabular-nums text-white">{unlimited ? '∞' : format(coins)}</span>
        <Plus className="h-3.5 w-3.5 text-slot-green" />
      </button>

      <div className="min-w-0 flex-1 rounded-xl bg-white/5 px-2 py-1 text-center">
        <p className="text-[8px] font-black tracking-[0.2em] text-slot-gold/80">WIN</p>
        <p className={`font-mono text-sm font-black leading-tight tabular-nums ${win > 0 ? 'text-slot-green' : 'text-white/70'}`}>
          {format(win)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white/5 p-1">
        <StepKey icon={Minus} label="Bahsi azalt" disabled={spinning} onClick={() => onBet(-1)} />
        <div className="w-14 text-center">
          <p className="text-[8px] font-black tracking-[0.2em] text-slot-gold/80">BET</p>
          <p className="font-mono text-sm font-black leading-tight tabular-nums text-white">{format(bet)}</p>
        </div>
        <StepKey icon={Plus} label="Bahsi artır" disabled={spinning} onClick={() => onBet(1)} />
      </div>

      <button
        type="button"
        onClick={onMax}
        disabled={disabled || spinning}
        className="h-9 shrink-0 rounded-xl bg-white/10 px-2 text-[10px] font-black tracking-widest text-white active:brightness-125 disabled:opacity-40"
      >
        MAX
      </button>

      <button
        type="button"
        onClick={onAuto}
        disabled={disabled}
        aria-pressed={auto}
        className={`h-9 shrink-0 rounded-xl px-2 text-[10px] font-black tracking-widest active:brightness-125 ${
          auto ? 'bg-slot-green text-slot' : 'bg-white/10 text-white'
        }`}
      >
        AUTO
      </button>
    </div>
  );
}