import React from 'react';
import EliminSymbol from './EliminSymbol';
import { ROWS, SYMBOL_IDS } from './eliminConfig';
import ReelSpin from '@/components/games/reels/ReelSpin';

const renderElimin = (id) => <EliminSymbol id={id} />;

/**
 * Tek makara: gerçek makara gibi döner, sonuç gelince sırası geldiğinde durur.
 * Kare kartlar kendi hücresinde durur; üst üste binme olmaz.
 */
export default function EliminReel({
  reel, column, initial, landing, spinning, stopping, winCells, explodeCells, explode, drops, spinKey,
}) {
  if (spinning && !stopping) {
    return (
      <div className="el-reel">
        <ReelSpin
          reel={reel}
          rows={ROWS}
          spinKey={spinKey}
          landing={landing}
          initial={initial}
          symbols={SYMBOL_IDS}
          cellClassName="el-cell el-cell-roll"
          renderSymbol={renderElimin}
        />
      </div>
    );
  }

  return (
    <div className="el-reel">
      {column.map((id, row) => {
        const key = `${reel}-${row}`;
        return (
          <span key={row} className={`el-cell ${drops.has(key) ? 'el-drop' : ''}`}>
            <EliminSymbol id={id} win={winCells.has(key)} explode={!!explode && explodeCells.has(key)} />
          </span>
        );
      })}
    </div>
  );
}