import React from 'react';
import { ART_WIDTH, SLOT_FIELD_LABELS } from './slotLayout';

/**
 * Görselde basılı alt etiketler (LINES / TOTAL BET / WIN / BET) gizlenir; yerine
 * canlı değerlerin kendi adları yazılır. Yazı boyutu etiketin kutusuna göre ölçeklenir.
 */
export default function SlotFieldLabels({ scale = 0 }) {
  return (
    <>
      {SLOT_FIELD_LABELS.map(({ text, box, skin }) => {
        const artWidth = (parseFloat(box.width) / 100) * ART_WIDTH;
        const fontSize = Math.min(24, artWidth / (0.68 * text.length)) * (scale || 0);
        return (
          <span
            key={text}
            className="absolute flex items-center justify-center overflow-hidden font-black uppercase leading-none tracking-[0.06em] text-white/85"
            style={{ ...box, backgroundColor: skin, fontSize: `${fontSize.toFixed(2)}px` }}
          >
            {text}
          </span>
        );
      })}
    </>
  );
}