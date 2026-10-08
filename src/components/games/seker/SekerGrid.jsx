import React, { useMemo } from 'react';
import SekerSymbol from './SekerSymbol';
import { SEKER_SYMBOLS, randomGrid } from './sekerConfig';
import useReelRoll from '@/components/games/reels/reelRoll';
import '@/styles/reelRoll.css';

// Tur boyunca akan dolgu sembolleri.
const SYMBOL_IDS = Object.keys(SEKER_SYMBOLS);

/** Tek makara: tur boyunca kesintisiz döner, sonuç gelince tam sonucun üzerine iner. */
function SekerColumn({ reel, column, landing, moving, spinKey, winCells }) {
  const roll = useReelRoll({ reel, spinKey, landing, rows: column.length, symbols: SYMBOL_IDS });
  const visibleRows = String(column.length);

  return (
    <div className="seker-column">
      {!moving && column.map((id, row) => (
        <span key={row} className="seker-cell">
          <SekerSymbol
            id={id}
            win={winCells.has(`${reel}-${row}`)}
            scatter={SEKER_SYMBOLS[id]?.scatter}
          />
        </span>
      ))}

      {moving && (roll.landingTiles ? (
        // İniş: dolgu satırları akar, sonuç şekerleri tam yerine oturur.
        <div
          className="rl-strip rl-strip-land"
          style={{
            '--rl-visible': visibleRows,
            '--rl-rows': String(roll.landingRows),
            '--rl-from': roll.from,
            '--rl-to': roll.to,
            '--rl-dur': `${roll.duration}ms`,
          }}
        >
          {roll.landingTiles.map((id, index) => (
            <span key={index} className="seker-cell"><SekerSymbol id={id} /></span>
          ))}
        </div>
      ) : (
        // Bekleme: şerit kusursuz döngüde akar (içerik iki kez yazılır).
        <div
          className="rl-strip rl-strip-loop"
          style={{
            '--rl-visible': visibleRows,
            '--rl-rows': String(roll.waitingRows),
            '--rl-loop': `${roll.loopMs}ms`,
          }}
        >
          {roll.waiting.map((id, index) => (
            <span key={index} className="seker-cell"><SekerSymbol id={id} /></span>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Sonuç ızgarası: 6 sütun x 6 satır. Tur boyunca sütunlar kesintisiz akar,
 * sonuç gelince şekerler tam sunucunun dizilimine oturur.
 */
export default function SekerGrid({ spinning, stopping, landing, spinKey, grid, wins }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;

  const winCells = useMemo(() => {
    const cells = new Set();
    if (moving) return cells;
    (wins || []).forEach((item) => {
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [moving, wins]);

  return (
    <div className="seker-board flex h-full w-full items-stretch">
      {visible.map((column, reel) => (
        <SekerColumn
          key={reel}
          reel={reel}
          column={column}
          landing={landing?.[reel] || null}
          moving={moving}
          spinKey={spinKey}
          winCells={winCells}
        />
      ))}
    </div>
  );
}