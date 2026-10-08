import React, { useEffect, useMemo, useState } from 'react';
import SekerliSymbol from './SekerliSymbol';
import { ROWS } from './sekerliConfig';
import { randomSymbol } from './sekerliBoard';

// Görünür alanın üstünde akan sembol sayısı ve sütun başına dönüş süresi.
const ROLL_ROWS = 7;
const DURATION_BASE = 1120;
const DURATION_STEP = 135;

/**
 * Tek makara: tur boyunca şerit yukarıdan akar, sonuç sembolleri yerine oturur.
 * Kazanan semboller parlar, patlar ve üstten düşen yenileriyle değişir.
 */
export default function SekerliReel({ reel, column, spinning, stopping, winCells, newCells, phase, spinKey }) {
  const [landed, setLanded] = useState(false);
  const duration = DURATION_BASE + reel * DURATION_STEP;
  const rows = ROLL_ROWS + ROWS;
  // Şerit içeriği tur boyunca sabit kalır; her yeni turda yeniden çekilir.
  const rollStrip = useMemo(
    () => Array.from({ length: ROLL_ROWS }, () => randomSymbol()),
    [spinKey],
  );

  useEffect(() => {
    setLanded(false);
  }, [spinKey]);

  if (spinning && !stopping) {
    return (
      <div className="sl-reel">
        <div
          className={`sl-strip ${landed ? 'sl-strip-bounce' : ''}`}
          style={{
            '--sl-rows': rows,
            '--sl-roll': `-${((ROLL_ROWS / rows) * 100).toFixed(4)}%`,
            '--sl-dur': `${duration}ms`,
          }}
          onAnimationEnd={() => setLanded(true)}
        >
          {/* Şerit: akan semboller ve altta yerine oturacak sonuç sembolleri. */}
          {[...rollStrip, ...column.map((cell) => cell.sym)].map((sym, index) => (
            <span key={`${spinKey}-${index}`} className="sl-cell sl-cell-roll">
              <SekerliSymbol id={sym} />
            </span>
          ))}
        </div>
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