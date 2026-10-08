import React from 'react';
import { Crown } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Jackpot konsolundaki havuz hücresi: adı üstte, değeri altta; orta havuz büyük ve altın. */
export default function SlotPoolCell({ label, value, tone, main = false }) {
  return (
    <span
      className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border px-1.5 py-1 ${
        main ? 'border-slot-gold/60 bg-black/55' : 'border-slot-gold/25 bg-black/40'
      }`}
    >
      <span className="flex items-center gap-1">
        {main && <Crown className="h-3 w-3 shrink-0 text-slot-gold" />}
        <span className={`truncate text-[8px] font-black uppercase leading-none tracking-[0.1em] ${tone}`}>{label}</span>
      </span>
      <span
        className={`slot-digits mt-1 font-mono font-black leading-none tabular-nums ${
          main ? 'text-[13px] text-slot-gold' : 'text-[11px] text-white/95'
        }`}
      >
        {format(value)}
      </span>
    </span>
  );
}