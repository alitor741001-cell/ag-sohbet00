import React from 'react';
import EliminSymbol from './EliminSymbol';
import { ROWS, SYMBOL_IDS } from './eliminConfig';
import useReelRoll from '@/components/games/reels/reelRoll';
import '@/styles/reelRoll.css';

/**
 * Tek makara: tur boyunca kesintisiz döner, sonuç gelince tam sonucun üzerine iner.
 * Kare kartlar kendi hücresinde durur; üst üste binme olmaz.
 */
export default function EliminReel({
  reel, column, landing, spinning, stopping, winCells, explodeCells, explode, drops, spinKey,
}) {
  const roll = useReelRoll({ reel, spinKey, landing, rows: ROWS, symbols: SYMBOL_IDS });
  const visibleRows = String(ROWS);
  const moving = spinning && !stopping;

  if (moving) {
    return (
      <div className="el-reel">
        {roll.landingTiles ? (
          <div
            className="rl-strip rl-strip-land el-strip"
            style={{
              '--rl-visible': visibleRows,
              '--rl-rows': String(roll.landingRows),
              '--rl-from': roll.from,
              '--rl-to': roll.to,
              '--rl-dur': `${roll.duration}ms`,
            }}
          >
            {roll.landingTiles.map((sym, index) => (
              <span key={`${spinKey}-${index}`} className="el-cell el-cell-roll">
                <EliminSymbol id={sym} />
              </span>
            ))}
          </div>
        ) : (
          <div
            className="rl-strip rl-strip-loop el-strip"
            style={{
              '--rl-visible': visibleRows,
              '--rl-rows': String(roll.waitingRows),
              '--rl-loop': `${roll.loopMs}ms`,
            }}
          >
            {roll.waiting.map((sym, index) => (
              <span key={`${spinKey}-${index}`} className="el-cell el-cell-roll">
                <EliminSymbol id={sym} />
              </span>
            ))}
          </div>
        )}
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