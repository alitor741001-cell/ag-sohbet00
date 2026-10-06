import React from 'react';
import { BETTING_MS, colorForMult } from './rocketConfig';

// Tasarımdaki halkanın ölçüsü: merkez ve yarıçap (tasarım pikselleri).
const CX = 500;
const CY = 580;
const R = 58;
const CIRC = 2 * Math.PI * R;
const TONE = { blue: '#5fd0ff', green: '#4ade80', yellow: '#fbbf24', red: '#f87171' };
const short = (value) => (Math.round((value || 0) * 100) / 100).toFixed(2);

/**
 * Merkez gösterge: bahis aşamasında geri sayım, uçuşta çarpan, tur sonunda sonuç.
 * Halkanın dolgusu geri sayımla birebir azalır, her saniyede ışık atar.
 */
export default function RocketLiveGauge({ phase, mult, countdown, countdownMs }) {
  const betting = phase === 'betting';
  const fraction = betting
    ? (countdownMs === null ? 1 : Math.max(0, Math.min(1, countdownMs / BETTING_MS)))
    : 0;
  // Son üç saniyede geri sayım rengi ısınır.
  const hot = betting && countdown !== null && countdown <= 3;
  const color = betting ? (hot ? '#ffc65c' : '#7fe4ff') : TONE[colorForMult(mult)];

  return (
    <>
      {/* Tasarımdaki halkanın içi kapatılır: sayı ortada, net okunur. */}
      <span
        className="absolute rounded-full"
        style={{ left: CX - 62, top: CY - 62, width: 124, height: 124, background: '#04081c' }}
      />

      <svg className="pointer-events-none absolute inset-0" width={828} height={1485} viewBox="0 0 828 1485">
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.5}
          style={{ filter: `drop-shadow(0 0 9px ${color})` }}
        />
        {betting && (
          <circle
            cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - fraction)}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: 'stroke-dashoffset 120ms linear' }}
          />
        )}
        {betting && countdown !== null && (
          <circle key={countdown} className="rk-ring-pulse" cx={CX} cy={CY} r={R + 7} fill="none" stroke={color} strokeWidth={5} />
        )}
        {phase === 'running' && (
          <circle
            cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={4} strokeOpacity={0.9}
            style={{ filter: `drop-shadow(0 0 13px ${color})` }}
          />
        )}
        {phase === 'crashed' && (
          <circle key="crash" className="rk-crash-flash" cx={CX} cy={CY} r={R + 10} fill="none" stroke="#ff6b6b" strokeWidth={9} />
        )}
      </svg>

      <span
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ left: CX - 130, top: CY - 62, width: 260, height: 88 }}
      >
        {betting ? (
          <span
            key={countdown}
            className="rk-count-pop font-black"
            style={{ fontSize: 62, color, textShadow: `0 0 26px ${color}88` }}
          >
            {countdown ?? '—'}
          </span>
        ) : (
          <span
            key={phase}
            className="rk-count-pop font-black"
            style={{ fontSize: 50, color, textShadow: `0 0 24px ${color}77` }}
          >
            {short(mult)}
          </span>
        )}
      </span>

      <span
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ left: CX - 130, top: CY + 30, width: 260, height: 24 }}
      >
        <span className="font-black tracking-[0.18em] text-[#8fb6d8]" style={{ fontSize: 15 }}>
          {betting ? 'BAHİS' : phase === 'running' ? 'UÇUŞTA' : phase === 'crashed' ? 'ÇAKILDI' : 'YÜKLENİYOR'}
        </span>
      </span>
    </>
  );
}