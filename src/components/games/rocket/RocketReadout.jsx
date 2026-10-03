import React from 'react';
import { Coins } from 'lucide-react';
import { format, formatMult, colorForMult, MULT_COLOR_CLASS } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Üst: toplam coin canlı; ortadaki büyük çarpan / durum yazısı. */
export default function RocketReadout({ coins, liveMult, round }) {
  const phase = round?.status;
  let big = '';
  let cls = 'text-white';
  if (phase === 'running') {
    big = formatMult(liveMult);
    cls = `${MULT_COLOR_CLASS[colorForMult(liveMult)]} drop-shadow-[0_0_16px_rgba(255,255,255,0.45)]`;
  } else if (phase === 'betting') {
    big = 'HAZIRLANIYOR';
    cls = 'text-sky-300';
  } else if (phase === 'crashed') {
    big = `PATLADI ${formatMult(round?.crash_at || 1)}`;
    cls = 'text-red-500';
  }

  return (
    <>
      <div
        className="absolute flex items-center justify-end gap-1 rounded-lg bg-black/60 px-2"
        style={ROCKET_LAYOUT.coinBox}
      >
        <Coins className="h-4 w-4 text-amber-300" />
        <span className="font-mono text-sm font-black text-amber-200">{format(coins)}</span>
      </div>
      {/* Görselin kendi çarpan yazısı, hareketli katmanla kaymasın diye bu alan kapatılır. */}
      <div
        className="absolute flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-md"
        style={ROCKET_LAYOUT.bigMultiplier}
      >
        <span
          className={`text-3xl font-black ${cls}`}
          style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}
        >
          {big}
        </span>
      </div>
    </>
  );
}