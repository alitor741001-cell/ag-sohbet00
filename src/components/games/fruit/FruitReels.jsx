import React, { useMemo } from 'react';
import FruitSymbol from './FruitSymbol';
import { FRUIT_SYMBOLS, randomGrid } from './fruitConfig';
import useCellDrops from '@/components/games/reels/useCellDrops';
import useReelRoll from '@/components/games/reels/reelRoll';
import '@/styles/reelRoll.css';

// Tur boyunca akan dolgu sembolleri.
const SYMBOL_IDS = Object.keys(FRUIT_SYMBOLS);

/** Tek makara: tur boyunca kesintisiz döner, sonuç gelince tam sonucun üzerine iner. */
function FruitReel({ reel, column, landing, moving, spinKey, winCells, explodeCells, explode, drops }) {
  const roll = useReelRoll({ reel, spinKey, landing, rows: column.length, symbols: SYMBOL_IDS });
  const visibleRows = String(column.length);

  return (
    <div className="fruit-column min-w-0 flex-1 p-[2px] sm:p-1">
      {!moving && column.map((id, row) => {
        const key = `${reel}-${row}`;
        return (
          <span key={row} className={`fruit-cell ${drops.has(key) ? 'fruit-drop' : ''}`}>
            <FruitSymbol
              id={id}
              win={winCells.has(key)}
              explode={!!explode && explodeCells.has(key)}
              scatter={FRUIT_SYMBOLS[id]?.scatter}
            />
          </span>
        );
      })}

      {moving && (roll.landingTiles ? (
        // İniş: dolgu satırları akar, sonuç sembolleri tam yerine oturur.
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
            <span key={index} className="fruit-cell"><FruitSymbol id={id} /></span>
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
            <span key={index} className="fruit-cell"><FruitSymbol id={id} /></span>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Sonuç ızgarası: 6 sütun x 5 satır. Tur boyunca sütunlar kesintisiz akar,
 * sonuç gelince kartlar tam sunucunun dizilimine oturur.
 */
export default function FruitReels({ spinning, stopping, landing, spinKey, grid, wins, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;
  // Patlayanların yerine düşen karolar değişen hücrelerdir: kayma animasyonuyla gelirler.
  const drops = useCellDrops({ grid: visible, rolling: moving, landing });

  const winCells = useMemo(() => {
    const cells = new Set();
    if (moving) return cells;
    (wins || []).forEach((item) => {
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [moving, wins]);

  // Patlayan karolar: skatter (altın muz) yerinde durur.
  const explodeCells = useMemo(() => {
    const cells = new Set();
    (wins || []).forEach((item) => {
      if (item.scatter) return;
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [wins]);

  return (
    <div className="flex h-full w-full items-stretch gap-[3px] sm:gap-1.5">
      {visible.map((column, reel) => (
        <FruitReel
          key={reel}
          reel={reel}
          column={column}
          landing={landing?.[reel] || null}
          moving={moving}
          spinKey={spinKey}
          winCells={winCells}
          explodeCells={explodeCells}
          explode={explode}
          drops={drops}
        />
      ))}
    </div>
  );
}