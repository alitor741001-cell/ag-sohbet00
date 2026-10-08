import React from 'react';
import { Rocket } from 'lucide-react';
import { BETTING_MS, formatMult } from './rocketConfig';

const PHASE_TEXT = { running: 'YÜKSELİYOR', crashed: 'ÇAKILDI' };

/**
 * Sahnenin orta göstergesi: bahis aşamasında geri sayım halkası ve saniyeler,
 * uçuşta canlı çarpan, çakılınca çakılma çarpanı görünür.
 */
export default function RocketReadout({ phase, mult, countdown, roundNo }) {
  const crashed = phase === 'crashed';
  const betting = phase === 'betting';
  const seconds = countdown ?? 0;
  // Halka bahis süresi boyunca boşalır.
  const elapsed = Math.min(1, Math.max(0, 1 - seconds / (BETTING_MS / 1000)));

  return (
    <div className="pointer-events-none absolute inset-y-0 left-[34%] right-0 z-10 flex flex-col items-center justify-center gap-1.5">
      <span className="rk-readout-emblem" aria-hidden="true">
        <Rocket className="h-3.5 w-3.5" />
      </span>
      <p className="rk-tagline">HAYAL ET · İZLE · KEYFİNİ ÇIKAR</p>

      <span className="relative flex items-center justify-center">
        {betting && (
          <svg viewBox="0 0 100 100" className="absolute h-28 w-28 -rotate-90" fill="none" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="rk-ring-track" />
            <circle cx="50" cy="50" r="46" pathLength="1" className="rk-ring-live" style={{ strokeDashoffset: 1 - elapsed }} />
          </svg>
        )}
        <p
          key={`${roundNo}-${phase}-${betting ? seconds : ''}`}
          className={`rk-mult relative text-[46px] leading-none ${crashed ? 'rk-mult-crash' : ''}`}
        >
          {betting ? seconds : formatMult(mult)}
        </p>
      </span>

      <p className={`rk-phase ${crashed ? 'rk-phase-crash' : ''}`}>
        {betting ? `BAHİSLER AÇIK · ${seconds} SN` : PHASE_TEXT[phase] || ''}
      </p>
    </div>
  );
}