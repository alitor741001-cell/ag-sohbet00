import React from 'react';
import { format, formatMult, colorForMult, MULT_COLOR_CLASS } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Sağ alt panel: tur numarası, anlık çarpan / çakılma, oyuncu sayısı ve havuz. */
export default function RocketRoundInfo({ game }) {
  const { round, liveMult, bets } = game;
  const phase = round?.status;
  const pot = bets.filter((b) => b.status === 'active').reduce((s, b) => s + (b.bet || 0), 0);

  return (
    <div
      className="absolute flex flex-col items-center justify-center gap-1 rounded-lg bg-black/65 p-2 text-center"
      style={ROCKET_LAYOUT.betPanelRight}
    >
      <p className="text-[10px] font-black text-amber-300">TUR #{round?.round_no ?? '-'}</p>
      {phase === 'betting' && <p className="text-xs font-black text-sky-300">BAHİS AŞAMASI</p>}
      {phase === 'running' && (
        <p className={`text-2xl font-black ${MULT_COLOR_CLASS[colorForMult(liveMult)]}`} style={{ textShadow: '0 0 12px rgba(255,255,255,0.35)' }}>
          {formatMult(liveMult)}
        </p>
      )}
      {phase === 'crashed' && (
        <p className="text-sm font-black text-red-500">PATLADI {formatMult(round?.crash_at || 1)}</p>
      )}
      <div className="mt-0.5 flex w-full justify-between px-1 text-[10px] text-white/70">
        <span>Oyuncu: {bets.length}</span>
        <span>Havuz: {format(pot)}</span>
      </div>
    </div>
  );
}