import React from 'react';
import { ART_HEIGHT, ART_WIDTH, SLOT_FIELDS, SLOT_FIELD_SKINS, SLOT_TEXT_PX } from './slotLayout';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/**
 * Havuz değerinin yazı boyutu: görselin kendi rakam yüksekliğine göre ölçeklenir,
 * uzun değerler de kutunun dışına taşmaz.
 */
const fitFont = (box, text, base, scale) => {
  const artWidth = (parseFloat(box.width) / 100) * ART_WIDTH;
  const artHeight = (parseFloat(box.height) / 100) * ART_HEIGHT;
  const byWidth = artWidth / (0.62 * Math.max(1, text.length));
  return Math.max(6, Math.min(base, byWidth, artHeight) * (scale || 0));
};

/** Havuz alanı görselin kendi zemin rengine boyanır: siyah dikdörtgen izi kalmaz. */
function Cell({ box, value, tone, size, skin, scale }) {
  const text = format(value);
  return (
    <span
      className={`absolute flex items-center justify-center overflow-hidden rounded-sm font-mono font-black tabular-nums slot-digits ${tone}`}
      style={{ ...box, backgroundColor: skin, fontSize: `${fitFont(box, text, size, scale).toFixed(2)}px` }}
    >
      {text}
    </span>
  );
}

/** Görselin ödül havuzu alanlarına yazılan canlı değerler; havuzlar kayıplarla büyür. */
export default function SlotReadout({ pools, scale }) {
  const poolCells = [
    { box: SLOT_FIELDS.jackpots[0], value: pools?.mega, tone: 'text-slot-gold' },
    { box: SLOT_FIELDS.jackpots[1], value: pools?.jackpot, tone: 'text-slot-gold' },
    { box: SLOT_FIELDS.jackpots[2], value: pools?.big, tone: 'text-white' },
    { box: SLOT_FIELDS.jackpots[3], value: pools?.xmega, tone: 'text-white' },
    { box: SLOT_FIELDS.jackpots[4], value: pools?.mini, tone: 'text-white' },
  ];

  return (
    <>
      {poolCells.map(({ box, value, tone }, index) => (
        <Cell
          key={index}
          box={box}
          value={value}
          tone={tone}
          size={SLOT_TEXT_PX.pool}
          skin={SLOT_FIELD_SKINS.jackpots[index]}
          scale={scale}
        />
      ))}
    </>
  );
}