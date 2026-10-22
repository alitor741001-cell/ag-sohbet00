import React, { useEffect, useMemo, useRef } from 'react';
import SekerSymbol from './SekerSymbol';
import { SEKER_SYMBOLS, randomGrid } from './sekerConfig';
import useCellDrops from '@/components/games/reels/useCellDrops';
import ReelSpin from '@/components/games/reels/ReelSpin';

// Tur boyunca akan dolgu sembolleri.
const SYMBOL_IDS = Object.keys(SEKER_SYMBOLS);
const renderSeker = (id) => <SekerSymbol id={id} />;

/** Tek makara: gerçek makara gibi döner, sonuç gelince sırası geldiğinde durur. */
function SekerColumn({ reel, column, initial, landing, moving, spinKey, winCells, explodeCells, explode, drops }) {
  return (
    <div className="seker-column">
      {moving ? (
        <ReelSpin
          reel={reel}
          rows={column.length}
          spinKey={spinKey}
          landing={landing}
          initial={initial}
          symbols={SYMBOL_IDS}
          cellClassName="seker-cell"
          renderSymbol={renderSeker}
        />
      ) : column.map((id, row) => {
        const key = `${reel}-${row}`;
        return (
          <span key={row} className={`seker-cell ${drops.has(key) ? 'seker-drop' : ''}`}>
            <SekerSymbol
              id={id}
              win={winCells.has(key)}
              explode={!!explode && explodeCells.has(key)}
              scatter={SEKER_SYMBOLS[id]?.scatter}
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Sonuç ızgarası: 6 sütun x 6 satır. Makaralar ekrandaki şekerlerden kalkar,
 * soldan sağa sırayla durur ve şekerler tam sunucunun dizilimine oturur.
 */
export default function SekerGrid({ spinning, stopping, landing, spinKey, grid, wins, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;
  // Patlayanların yerine düşen şekerler değişen hücrelerdir: kayma animasyonuyla gelirler.
  const drops = useCellDrops({ grid: visible, rolling: moving, landing });
  // Kalkışta ekranda duran dizilim: makaralar bu şekerlerden kalkar.
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

  // Patlayan şekerler: altın şeker (skatter) yerinde durur.
  const explodeCells = useMemo(() => {
    const cells = new Set();
    (wins || []).forEach((item) => {
      if (item.scatter) return;
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [wins]);

  return (
    <div className="seker-board flex h-full w-full items-stretch">
      {visible.map((column, reel) => (
        <SekerColumn
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