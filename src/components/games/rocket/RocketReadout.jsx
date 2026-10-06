import React from 'react';
import { colorForMult, formatMult, MULT_COLOR_CLASS } from './rocketConfig';

const PHASE_TEXT = { running: 'Yükseliyor', crashed: 'Çakıldı', betting: 'Bahisler açık' };
const BETTING_MS = 20000;

/**
 * Sahnenin ortasındaki dairesel gösterge: bahis aşamasında geri sayım halkası
 * ve saniyeler, uçuşta canlı çarpan, çakılınca çakılma çarpanı görünür.
 */
export default function RocketReadout({ phase, mult, countdown, countdownMs, roundNo }) {
  const crashed = phase === 'crashed';
  const betting = phase === 'betting';
  const seconds = countdown ?? 0;
  const fraction = betting && countdownMs != null ? Math.min(1, Math.max(0, countdownMs / BETTING_MS)) : 0;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-[33%] right-0 z-30 flex items-center justify-center">
      <div className="rk-dial">
        <span className="rk-dial-track" aria-hidden="true" />
        {betting && (
          <span
            className="rk-dial-fill"
            style={{ background: `conic-gradient(from -90deg, rgba(0,212,255,.95) ${fraction * 360}deg, rgba(0,212,255,.08) 0deg)` }}
            aria-hidden="true"
          />
        )}
        {!betting && <span className="rk-dial-live" aria-hidden="true" />}

        <div className="rk-dial-core">
          <p
            key={`${roundNo}-${phase}-${betting ? seconds : ''}`}
            className={`rk-mult leading-none text-[clamp(26px,8.5vw,46px)] ${
              crashed ? 'rk-mult-crash' : betting ? 'text-[#cdeeff]' : MULT_COLOR_CLASS[colorForMult(mult)]
            }`}
          >
            {betting ? seconds : formatMult(mult)}
          </p>
          <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${crashed ? 'text-red-400' : 'text-[#7fe4ff]'}`}>
            {betting ? `${PHASE_TEXT.betting} · ${seconds} sn` : PHASE_TEXT[phase] || ''}
          </p>
        </div>
      </div>
    </div>
  );
}