import React from 'react';
import { ART_HEIGHT, ART_WIDTH, SLOT_FIELDS, SLOT_FIELD_SKINS, SLOT_TEXT_PX } from './slotLayout';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/**
 * Görselin kendi rakam yüksekliğine göre yazı boyutu: değerler görselin yazısıyla
 * aynı büyüklükte durur, uzun değerler de kutunun dışına taşmaz.
 */
const fitFont = (box, text, base, scale) => {
  const artWidth = (parseFloat(box.width) / 100) * ART_WIDTH;
  const artHeight = (parseFloat(box.height) / 100) * ART_HEIGHT;
  const byWidth = artWidth / (0.62 * Math.max(1, text.length));
  return Math.max(6, Math.min(base, byWidth, artHeight) * (scale || 0));
};

/** Rakam alanı görselin kendi zemin rengine boyanır: siyah dikdörtgen izi kalmaz. */
function Cell({ box, value, tone = 'text-slot-gold', size = SLOT_TEXT_PX.value, skin, scale }) {
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

/** Görselin kendi rakam alanlarına yazılan canlı değerler; havuzlar kayıplarla büyür. */
export default function SlotReadout({ coins, win, bet, lines, pools, scale }) {
  const [mega, jackpot, big, xmega, mini] = SLOT_FIELDS.jackpots;
  // Havuz değerleri görseldeki renkleriyle yazılır: üst sıra altın, alt sıra beyaz.
  const poolCells = [
    { box: mega, value: pools?.mega, tone: 'text-slot-gold' },
    { box: jackpot, value: pools?.jackpot, tone: 'text-slot-gold' },
    { box: big, value: pools?.big, tone: 'text-white' },
    { box: xmega, value: pools?.xmega, tone: 'text-white' },
    { box: mini, value: pools?.mini, tone: 'text-white' },
  ];

  return (
    <>
      <Cell box={SLOT_FIELDS.lines} value={lines} skin={SLOT_FIELD_SKINS.lines} scale={scale} />
      <Cell box={SLOT_FIELDS.totalBet} value={bet * lines} skin={SLOT_FIELD_SKINS.totalBet} scale={scale} />
      <Cell box={SLOT_FIELDS.win} value={win} tone={win > 0 ? 'text-slot-gold' : 'text-slot-gold/60'} skin={SLOT_FIELD_SKINS.win} scale={scale} />
      <Cell box={SLOT_FIELDS.bet} value={bet} skin={SLOT_FIELD_SKINS.bet} scale={scale} />
      <Cell box={SLOT_FIELDS.balance} value={coins} skin={SLOT_FIELD_SKINS.balance} scale={scale} />

      {poolCells.map(({ box, value, tone }, index) => (
        <Cell key={index} box={box} value={value} tone={tone} size={SLOT_TEXT_PX.pool} skin={SLOT_FIELD_SKINS.jackpots[index]} scale={scale} />
      ))}
    </>
  );
}