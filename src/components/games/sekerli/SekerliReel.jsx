import React from 'react';
import SekerliSymbol from './SekerliSymbol';
import { ROWS, SYMBOL_IDS } from './sekerliConfig';
import ReelSpin from '@/components/games/reels/ReelSpin';

const renderSekerli = (id) => <SekerliSymbol id={id} />;

/**
 * Tek makara: gerçek makara gibi döner, sonuç gelince sırası geldiğinde durur.
 * DUR'a basılırsa makara sonuç gelene kadar döner, sonuç gelince hemen oturur.
 */
export default function SekerliReel({ reel, column, landing, spinning, winCells, newCells, phase, spinKey }) {
  if (spinning) {
    return (
      <div className="sl-reel">
        <ReelSpin
          reel={reel}
          rows={ROWS}
          spinKey={spinKey}
          landing={landing}
          initial={column.map((cell) => cell.sym)}
          symbols={SYMBOL_IDS}
          cellClassName="sl-cell sl-cell-roll"
          renderSymbol={renderSekerli}
        />
      </div>
    );
  }

  return (
    <div className="sl-reel">
      {column.map((cell, row) => {
        const cellKey = `${reel}-${row}`;
        return (
          <span key={cell.uid} className="sl-cell">
            <SekerliSymbol
              id={cell.sym}
              index={row}
              win={phase === 'win' && winCells.has(cellKey)}
              boom={phase === 'boom' && winCells.has(cellKey)}
              fall={newCells.has(cell.uid)}
            />
          </span>
        );
      })}
    </div>
  );
}