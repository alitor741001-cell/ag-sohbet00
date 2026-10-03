import React from 'react';
import { format } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Sol alt panel: bahis miktarı seçici + Bahis yap / Bahisi geri çek butonu. */
export default function RocketBetPanel({ game }) {
  const { bet, myBet, round, placeBet, cashout, status } = game;
  const phase = round?.status;
  const canBet = phase === 'betting' && !myBet;
  const canPull = !!myBet;
  const busy = status !== 'ready';

  const label = myBet ? 'BAHİSİ GERİ ÇEK' : canBet ? 'BAHİS YAP' : phase === 'running' ? 'TUR SÜRÜYOR' : 'HAZIRLANIYOR';
  const btnClass = myBet
    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-black'
    : canBet
    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white'
    : 'bg-slot-panel text-white/50';

  return (
    <>
      <div
        className="absolute flex items-center justify-center rounded-md bg-black/55"
        style={ROCKET_LAYOUT.betAmount}
      >
        <span className="font-mono text-sm font-black text-amber-200">{format(bet)}</span>
      </div>
      <button
        type="button"
        onClick={() => game.changeBet(-1)}
        disabled={!!myBet || busy}
        className="absolute flex items-center justify-center rounded-md bg-slot-panel text-lg font-black text-white active:scale-95 disabled:opacity-40"
        style={ROCKET_LAYOUT.betMinus}
        aria-label="Bahisi azalt"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => game.changeBet(1)}
        disabled={!!myBet || busy}
        className="absolute flex items-center justify-center rounded-md bg-slot-panel text-lg font-black text-white active:scale-95 disabled:opacity-40"
        style={ROCKET_LAYOUT.betPlus}
        aria-label="Bahisi artır"
      >
        +
      </button>
      <button
        type="button"
        onClick={myBet ? cashout : placeBet}
        disabled={busy || (!canBet && !canPull)}
        className={`absolute flex items-center justify-center rounded-lg text-xs font-black tracking-wide active:scale-95 disabled:opacity-60 ${btnClass}`}
        style={ROCKET_LAYOUT.betButton}
      >
        {label}
      </button>
    </>
  );
}