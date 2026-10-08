import React, { useEffect, useMemo, useRef } from 'react';
import DedeSymbol from './DedeSymbol';
import DedeOrb from './DedeOrb';
import DedeStrike from './DedeStrike';
import { randomGrid } from './dedeConfig';

/**
 * 6 sütun x 5 satır ızgara. Tur sırasında sütunlar akar; kazanan karolar parlar,
 * patlar ve yerlerine üstten yenileri düşer. Çarpan küreleri karelerin üstüne iner.
 */
export default function DedeReels({ rolling, grid, wins, orbs, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası ve akan şeridin sonsuz döngüsü.
  const fallback = useMemo(() => randomGrid(), []);
  const rollGrid = useMemo(() => randomGrid(), [rolling]);
  const visible = grid || fallback;
  const strips = useMemo(() => rollGrid.map((column) => [...column, ...column]), [rollGrid]);

  // Yeni inen karolar: sembolü değişen her hücre düşme animasyonuyla gelir.
  const previous = useRef(visible);
  const drops = useMemo(() => {
    const set = new Set();
    if (rolling) return set;
    const before = previous.current;
    visible.forEach((column, reel) => {
      column.forEach((symbol, row) => {
        if (before?.[reel]?.[row] !== symbol) set.add(`${reel}-${row}`);
      });
    });
    return set;
  }, [rolling, visible]);

  useEffect(() => {
    if (!rolling) previous.current = visible;
  }, [rolling, visible]);

  const winCells = useMemo(() => {
    const set = new Set();
    (wins || []).forEach((item) => (item.cells || []).forEach((cell) => set.add(`${cell.reel}-${cell.row}`)));
    return set;
  }, [wins]);

  // Skatter karoları patlamaz: dede yerinde kalır.
  const explodeCells = useMemo(() => {
    const set = new Set();
    (wins || []).forEach((item) => {
      if (item.scatter) return;
      (item.cells || []).forEach((cell) => set.add(`${cell.reel}-${cell.row}`));
    });
    return set;
  }, [wins]);

  return (
    <div className="relative flex h-full w-full items-stretch gap-[3px] sm:gap-1.5">
      {visible.map((column, reel) => (
        <div key={reel} className="dede-column min-w-0 flex-1 p-[2px] sm:p-1">
          {rolling ? (
            <div className="dede-strip" style={{ animationDuration: `${170 + reel * 25}ms` }}>
              {strips[reel].map((id, index) => (
                <span key={index} className="dede-cell">
                  <DedeSymbol id={id} />
                </span>
              ))}
            </div>
          ) : (
            column.map((id, row) => (
              <span key={row} className={`dede-cell ${drops.has(`${reel}-${row}`) ? 'dede-drop' : ''}`}>
                <DedeSymbol
                  id={id}
                  win={winCells.has(`${reel}-${row}`)}
                  explode={!!explode && explodeCells.has(`${reel}-${row}`)}
                />
                {/* Kazanan nesnelerin üstüne de şimşek düşer. */}
                {winCells.has(`${reel}-${row}`) && <DedeStrike className="dede-strike-cell" />}
              </span>
            ))
          )}
        </div>
      ))}

      {/* Çarpan küreleri: madalyonlar hücrelerin ortasına iner, altındaki nesneye şimşek düşer. */}
      {(orbs || []).map((orb) => (
        <React.Fragment key={`${orb.reel}-${orb.row}-${orb.value}`}>
          <span
            className="dede-strike"
            style={{
              left: `${(orb.reel / 6) * 100}%`,
              top: `${(orb.row / 5) * 100}%`,
              width: `${100 / 6}%`,
              height: `${100 / 5}%`,
            }}
          >
            <DedeStrike />
          </span>
          <span
            className="dede-orb-slot"
            style={{ left: `${((orb.reel + 0.5) / 6) * 100}%`, top: `${((orb.row + 0.5) / 5) * 100}%` }}
          >
            <DedeOrb value={orb.value} />
          </span>
        </React.Fragment>
      ))}


    </div>
  );
}