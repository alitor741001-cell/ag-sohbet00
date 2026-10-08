import React from 'react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Değer tonları: normal değer altın, boş kazanç soluk, kazanç yeşil yanar.
const TONES = {
  default: 'text-slot-gold',
  muted: 'text-white/55',
  win: 'text-slot-green',
};

/** Panelin üst şeridindeki okuma hücresi: etiket üstte, değer altta durur. */
export default function SlotDeckStat({ label, value, tone = 'default' }) {
  return (
    <span className="flex flex-col items-center justify-center rounded-xl border border-slot-gold/20 bg-black/40 px-1 py-1.5">
      <span className="text-[9px] font-black uppercase leading-none tracking-[0.08em] text-slot-gold/70">{label}</span>
      <span className={`slot-digits mt-1 font-mono text-sm font-black leading-none tabular-nums ${TONES[tone]}`}>
        {format(value)}
      </span>
    </span>
  );
}