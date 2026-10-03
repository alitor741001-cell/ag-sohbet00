import React from 'react';
import { SLOT_ART } from '@/components/games/slotAssets';
import { CELL_STYLE, SYMBOL_CELLS } from '@/components/games/slot/slotLayout';

export default function SlotSymbol({ symbol, top, height }) {
  const cell = SYMBOL_CELLS[symbol] || SYMBOL_CELLS.ten;
  return <span className="absolute left-0 w-full" style={{ top, height,
    backgroundImage: `url(${SLOT_ART.shell})`, backgroundSize: CELL_STYLE.backgroundSize,
    backgroundPosition: `${CELL_STYLE.x[cell.col]} ${CELL_STYLE.y[cell.row]}`,
  }} />;
}