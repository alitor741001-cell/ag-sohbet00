import React from 'react';
import { SLOT_ART } from '@/components/games/slotAssets';
import { CELL_ASPECT, CELL_STYLE, SYMBOL_CELLS } from '@/components/games/slot/slotLayout';

/** Küçük sembol ikonu: makara görselindeki hücreden kırpılır (tablolar için). */
export default function SlotSymbolIcon({ symbol, size = 18 }) {
  const cell = SYMBOL_CELLS[symbol] || SYMBOL_CELLS.ten;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{
        width: size,
        height: Math.round(size * CELL_ASPECT),
        backgroundImage: `url(${SLOT_ART.shell})`,
        backgroundSize: CELL_STYLE.backgroundSize,
        backgroundPosition: `${CELL_STYLE.x[cell.col]} ${CELL_STYLE.y[cell.row]}`,
      }}
    />
  );
}