import React from 'react';
import SekerliSymbol from './SekerliSymbol';
import { ROWS, SYMBOL_IDS } from './sekerliConfig';
import useReelRoll from '@/components/games/reels/reelRoll';
import '@/styles/reelRoll.css';

/**
 * Tek makara: tur boyunca kesintisiz döner, sonuç gelince tam sonucun üzerine iner.
 * Akış ortak makara altyapısından gelir; bu oyun o altyapının çıkış noktasıdır.
 */
export default function SekerliReel({ reel, column, landing, spinning, stopping, winCells, newCells, phase, spinKey }) {
  const roll = useReelRoll({ reel, spinKey, landing, rows: ROWS, symbols: SYMBOL_IDS });
  const visibleRows = String(ROWS);

  if (spinning && !stopping) {
    return (
      <div className="sl-reel">
        {roll.landingTiles ? (
          <div
            className="rl-strip rl-strip-land sl-strip"
            style={{
              '--rl-visible': visibleRows,
              '--rl-rows': String(roll.landingRows),
              '--rl-from': roll.from,
              '--rl-to': roll.to,
              '--rl-dur': `${roll.duration}ms`,
            }}
          >
            {/* Şerit: akan semboller ve altta yerine oturacak sonuç sembolleri. */}
            {roll.landingTiles.map((sym, index) => (
              <span key={`${spinKey}-${index}`} className="sl-cell sl-cell-roll">
                <SekerliSymbol id={sym} />
              </span>
            ))}
          </div>
        ) : (
          <div
            className="rl-strip rl-strip-loop sl-strip"
            style={{
              '--rl-visible': visibleRows,
              '--rl-rows': String(roll.waitingRows),
              '--rl-loop': `${roll.loopMs}ms`,
            }}
          >
            {/* Bekleme: şerit kusursuz döngüde akar (içerik iki kez yazılır). */}
            {roll.waiting.map((sym, index) => (
              <span key={`${spinKey}-${index}`} className="sl-cell sl-cell-roll">
                <SekerliSymbol id={sym} />
              </span>
            ))}
          </div>
        )}
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