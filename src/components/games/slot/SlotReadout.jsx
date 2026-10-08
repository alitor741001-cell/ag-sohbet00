import React from 'react';
import { SLOT_FIELDS, SLOT_FIELD_SKINS } from './slotLayout';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Rakam alanı görselin kendi zemin rengine boyanır: siyah dikdörtgen izi kalmaz. */
function Cell({ box, value, tone = 'text-white', size = 'text-[13px]', skin }) {
  return (
    <span
      className={`absolute flex items-center justify-center overflow-hidden rounded-sm font-mono font-black tabular-nums slot-digits ${size} ${tone}`}
      style={{ ...box, backgroundColor: skin }}
    >
      {value}
    </span>
  );
}

/** Görselin kendi rakam alanlarına yazılan canlı değerler; havuzlar kayıplarla büyür. */
export default function SlotReadout({ coins, win, bet, lines, pools }) {
  const [mega, jackpot, big, xmega, mini] = SLOT_FIELDS.jackpots;
  const poolCells = [
    { box: mega, value: pools?.mega },
    { box: jackpot, value: pools?.jackpot, tone: 'text-slot-gold' },
    { box: big, value: pools?.big },
    { box: xmega, value: pools?.xmega },
    { box: mini, value: pools?.mini },
  ];

  return (
    <>
      <Cell box={SLOT_FIELDS.lines} value={format(lines)} skin={SLOT_FIELD_SKINS.lines} />
      <Cell box={SLOT_FIELDS.totalBet} value={format(bet * lines)} skin={SLOT_FIELD_SKINS.totalBet} />
      <Cell box={SLOT_FIELDS.win} value={format(win)} tone={win > 0 ? 'text-slot-gold' : 'text-white/75'} skin={SLOT_FIELD_SKINS.win} />
      <Cell box={SLOT_FIELDS.bet} value={format(bet)} skin={SLOT_FIELD_SKINS.bet} />
      <Cell box={SLOT_FIELDS.balance} value={format(coins)} skin={SLOT_FIELD_SKINS.balance} />

      {poolCells.map(({ box, value, tone }, index) => (
        <Cell key={index} box={box} value={format(value)} tone={tone || 'text-slot-gold/90'} size="text-[12px]" skin={SLOT_FIELD_SKINS.jackpots[index]} />
      ))}
    </>
  );
}