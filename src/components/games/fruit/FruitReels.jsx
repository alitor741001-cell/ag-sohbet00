import React, { useEffect, useMemo, useRef } from 'react';
import FruitSymbol from './FruitSymbol';
import { FRUIT_SYMBOLS, randomGrid } from './fruitConfig';
import useCellDrops from '@/components/games/reels/useCellDrops';
import ReelSpin from '@/components/games/reels/ReelSpin';

// Tur boyunca akan dolgu sembolleri.
const SYMBOL_IDS = Object.keys(FRUIT_SYMBOLS);
const renderFruit = (id) => <FruitSymbol id={id} />;

/** Tek makara: gerçek makara gibi döner, sonuç gelince sırası geldiğinde durur. */
function FruitReel({ reel, column, initial, landing, moving, spinKey, winCells, explodeCells, explode, drops }) {
  return (
    <div className="fruit-column min-w-0 flex-1 p-[2px] sm:p-1">
      {moving ? (
        <ReelSpin
          reel={reel}
          rows={column.length}
          spinKey={spinKey}
          landing={landing}
          initial={initial}
          symbols={SYMBOL_IDS}
          cellClassName="fruit-cell"
          renderSymbol={renderFruit}
        />
      ) : column.map((id, row) => {
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
    </div>
  );
}

/**
 * Sonuç ızgarası: 6 sütun x 5 satır. Makaralar ekrandaki kartlardan kalkar,
 * soldan sağa sırayla durur ve kartlar tam sunucunun dizilimine oturur.
 */
export default function FruitReels({ spinning, stopping, landing, spinKey, grid, wins, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;
  // Patlayanların yerine düşen karolar değişen hücrelerdir: kayma animasyonuyla gelirler.
  const drops = useCellDrops({ grid: visible, rolling: moving, landing });
  // Kalkışta ekranda duran dizilim: makaralar bu kartlardan kalkar.
  const shownRef = useRef(visible);
  useEffect(() => {
    if (!moving) shownRef.current = visible;
  }, [moving, visible]);

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
          initial={shownRef.current?.[reel]}
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