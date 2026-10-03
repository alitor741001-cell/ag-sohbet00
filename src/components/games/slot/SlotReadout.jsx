import React from 'react';
import { SLOT_FIELDS } from './slotLayout';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function Cell({ box, value, tone = 'text-white', size = 'text-[13px]' }) {
  return (
    <span
      className={`absolute flex items-center justify-center overflow-hidden rounded-sm bg-black font-mono font-black tabular-nums slot-digits ${size} ${tone}`}
      style={box}
    >
      {value}
    </span>
  );
}

/** Görselin kendi rakam alanlarına yazılan canlı değerler + sıfırlanan üst ödül rakamları. */
export default function SlotReadout({ coins, win, bet, lines }) {
  return (
    <>
      <Cell box={SLOT_FIELDS.lines} value={format(lines)} />
      <Cell box={SLOT_FIELDS.totalBet} value={format(bet * lines)} />
      <Cell box={SLOT_FIELDS.win} value={format(win)} tone={win > 0 ? 'text-slot-gold' : 'text-white/75'} />
      <Cell box={SLOT_FIELDS.bet} value={format(bet)} />
      <Cell box={SLOT_FIELDS.balance} value={format(coins)} />

      {SLOT_FIELDS.jackpots.map((box, index) => (
        <Cell key={index} box={box} value="0" tone="text-slot-gold/90" size="text-[12px]" />
      ))}
    </>
  );
}