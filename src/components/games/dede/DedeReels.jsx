import React, { useEffect, useMemo, useRef } from 'react';
import DedeSymbol from './DedeSymbol';
import DedeOrb from './DedeOrb';
import { randomGrid } from './dedeConfig';

/**
 * 6 sütun x 5 satır ızgara. Tur sırasında sütunlar akar; kazanan karolar parlar,
 * patlar ve yerlerine üstten yenileri düşer. Çarpan küreleri karelerin üstüne iner.
 */
export default function DedeReels({ rolling, grid, wins, orbs, multiplier, explode }) {
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
              </span>
            ))
          )}
        </div>
      ))}

      {/* Çarpan küreleri: madalyonlar hücrelerin ortasına iner. */}
      {(orbs || []).map((orb) => (
        <span
          key={`${orb.reel}-${orb.row}-${orb.value}`}
          className="dede-orb-slot"
          style={{ left: `${((orb.reel + 0.5) / 6) * 100}%`, top: `${((orb.row + 0.5) / 5) * 100}%` }}
        >
          <DedeOrb value={orb.value} />
        </span>
      ))}

      {/* Biriken çarpan sağ alt köşede durur; her küre inişinde değer birleşerek büyür. */}
      {multiplier > 1 && (
        <span key={multiplier} className="dede-mult-accum">
          <span className="dede-mult-accum-label">BİRİKEN ÇARPAN</span>
          <span className="dede-mult-accum-value">×{multiplier}</span>
        </span>
      )}
    </div>
  );
}