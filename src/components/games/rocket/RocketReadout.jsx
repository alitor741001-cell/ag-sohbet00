import React from 'react';
import { Crown } from 'lucide-react';
import { formatMult } from './rocketConfig';

const PHASE_TEXT = { running: 'Yükseliyor', crashed: 'Çakıldı' };
const PHASE_CLASS = { betting: 'text-[#7fe4ff]', running: 'text-[#7fe4ff]', crashed: 'text-red-400' };

/**
 * Sahnenin orta göstergesi: bahis aşamasında 20 saniyelik geri sayım,
 * uçuşta canlı çarpan, çakılınca çakılma çarpanı görünür.
 */
export default function RocketReadout({ phase, mult, countdown, roundNo }) {
  const crashed = phase === 'crashed';
  const betting = phase === 'betting';
  const seconds = countdown ?? 0;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-[36%] right-0 flex flex-col items-center justify-center gap-1">
      <Crown className="h-4 w-4 text-[#ffb800]" />
      <p className="rocket-script text-[16px] leading-none text-white/85">Hayal Et · İzle · Keyfini Çıkar</p>
      <p
        key={`${roundNo}-${phase}-${betting ? seconds : ''}`}
        className={`rk-mult text-[52px] leading-none ${crashed ? 'rk-mult-crash' : ''}`}
      >
        {betting ? seconds : formatMult(mult)}
      </p>
      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${PHASE_CLASS[phase] || 'text-white/60'}`}>
        {betting ? `Bahisler açık · ${seconds} sn` : PHASE_TEXT[phase] || ''}
      </p>
    </div>
  );
}