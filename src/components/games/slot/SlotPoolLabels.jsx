import React from 'react';
import { SLOT_POOL_LABELS } from './slotLayout';

/** Görselde yazan havuz adlarının üzerine yazılan yeni adlar (Jackpot / BIG / X MEGA). */
export default function SlotPoolLabels() {
  return (
    <>
      {SLOT_POOL_LABELS.map(({ text, tone, box }) => (
        <span
          key={text}
          className={`absolute flex items-center justify-center overflow-hidden rounded-sm border border-slot-gold/40 bg-black text-[10px] font-black uppercase leading-none tracking-[0.06em] ${tone}`}
          style={box}
        >
          {text}
        </span>
      ))}
    </>
  );
}