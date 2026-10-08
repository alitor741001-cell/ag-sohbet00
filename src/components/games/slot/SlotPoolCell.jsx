import React from 'react';
import { Crown } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Jackpot konsolundaki havuz hücresi: taçlı etiket üstte, değer altta; orta havuz altın yanar. */
export default function SlotPoolCell({ label, value, tone, main = false }) {
  return (
    <span
      className={`relative flex min-w-0 flex-1 flex-col items-center overflow-hidden rounded-xl px-1.5 py-1.5 ${
        main ? 'slot-pool-main border border-slot-gold/70' : 'slot-gold-frame'
      }`}
    >
      {main && <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-50" />}

      <span className="relative flex items-center gap-1">
        <Crown className={`h-3 w-3 shrink-0 drop-shadow-[0_0_4px_rgba(255,215,0,0.8)] ${main ? 'text-slot-gold' : 'text-slot-gold/75'}`} />
        <span className={`truncate text-[8px] font-black uppercase leading-none tracking-[0.12em] ${tone}`}>{label}</span>
      </span>

      <span
        className={`slot-digits relative mt-1 font-mono font-black leading-none tabular-nums ${
          main ? 'text-[15px] text-slot-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.55)]' : 'text-[12px] text-white'
        }`}
      >
        {format(value)}
      </span>
    </span>
  );
}