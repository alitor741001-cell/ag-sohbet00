import React from 'react';
import { SLOT_POOL_LABELS, SLOT_TEXT_PX } from './slotLayout';

/** Görselde yazan havuz adlarının üzerine yazılan yeni adlar (Jackpot / BIG / X MEGA). */
export default function SlotPoolLabels({ scale = 0 }) {
  const fontSize = `${(SLOT_TEXT_PX.label * scale).toFixed(2)}px`;
  return (
    <>
      {SLOT_POOL_LABELS.map(({ text, tone, box }) => (
        <span
          key={text}
          className={`absolute flex items-center justify-center overflow-hidden rounded-md border border-slot-gold/45 bg-slot-bg font-black uppercase leading-none tracking-[0.08em] shadow-[inset_0_1px_0_hsl(var(--slot-gold)/0.22)] ${tone}`}
          style={{ ...box, fontSize }}
        >
          {text}
        </span>
      ))}
    </>
  );
}