import React from 'react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Değer tonları: normal değer altın, boş kazanç soluk, kazanç yeşil yanar.
const TONES = {
  default: 'text-slot-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.35)]',
  muted: 'text-white/55',
  win: 'text-slot-green drop-shadow-[0_0_10px_rgba(34,197,94,0.65)]',
};

/** Panelin üst şeridindeki okuma ekranı: altın çerçeve içinde etiket ve değer. */
export default function SlotDeckStat({ label, value, tone = 'default', icon: Icon }) {
  return (
    <span className="slot-gold-frame relative flex flex-col items-center justify-center overflow-hidden rounded-xl px-1 py-1.5">
      <span aria-hidden="true" className="slot-led absolute inset-0" />
      <span className="relative flex items-center gap-1 text-[9px] font-black uppercase leading-none tracking-[0.1em] text-slot-gold/80">
        {Icon && <Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />}
        {label}
      </span>
      <span className={`slot-digits relative mt-1 font-mono text-sm font-black leading-none tabular-nums ${TONES[tone]}`}>
        {format(value)}
      </span>
    </span>
  );
}