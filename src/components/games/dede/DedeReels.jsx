import React, { useEffect, useMemo, useRef } from 'react';
import DedeSymbol from './DedeSymbol';
import DedeOrb from './DedeOrb';
import DedeStrike from './DedeStrike';
import { DEDE_IDS, orbValueOf, randomGrid } from './dedeConfig';
import ReelSpin from '@/components/games/reels/ReelSpin';

// Dönen şeritte de çarpan jetonu kendi küresiyle görünür.
const renderDede = (id) => {
  const orb = orbValueOf(id);
  return orb ? <DedeOrb value={orb} /> : <DedeSymbol id={id} />;
};

/** Tek makara: gerçek makara gibi döner, sonuç gelince sırası geldiğinde durur. */
function DedeColumn({ reel, column, landing, rolling, spinKey, drops, winCells, explodeCells, strikeCells, strikeTone, explode }) {
  return (
    <div className="dede-column min-w-0 flex-1 p-[2px] sm:p-1">
      {rolling && (
        // Makara ekrandaki dizilimden kalkar ve sunucunun dizilimine oturur.
        <ReelSpin
          reel={reel}
          rows={column.length}
          spinKey={spinKey}
          landing={landing}
          initial={column}
          symbols={DEDE_IDS}
          cellClassName="dede-cell"
          renderSymbol={renderDede}
        />
      )}

      {!rolling && column.map((id, row) => {
        const key = `${reel}-${row}`;
        const orb = orbValueOf(id);
        return (
          <span key={row} className={`dede-cell ${drops.has(key) ? 'dede-drop' : ''}`}>
            {orb ? (
              <DedeOrb value={orb} />
            ) : (
              <DedeSymbol
                id={id}
                win={winCells.has(key)}
                explode={!!explode && explodeCells.has(key)}
              />
            )}
            {strikeCells.has(key) && <DedeStrike className="dede-strike-cell" tone={strikeTone} />}
          </span>
        );
      })}
    </div>
  );
}

/**
 * 6 sütun x 5 satır ızgara. Tur boyunca sütunlar kesintisiz akar ve tam sunucunun
 * dizilimine oturur; sonra kazanan karolar parlar, patlar ve yenileri düşer.
 */
export default function DedeReels({ rolling, landing, spinKey, grid, wins, orbs, strikeTone, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;

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
    // İniş tamamlandı: dizilim zaten ekranda, karolar yeniden düşmez.
    if (landing) previous.current = landing;
    else if (!rolling) previous.current = visible;
  }, [landing, rolling, visible]);

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

  // Yıldırım: kazanan nesnelerin üstüne; çarpan jetonu indiğinde ise hem jetonun
  // hem de onunla birlikte gelen nesnelerin üstüne düşer.
  const strikeCells = useMemo(() => {
    const set = new Set(winCells);
    if ((orbs || []).length) drops.forEach((key) => set.add(key));
    return set;
  }, [winCells, drops, orbs]);

  return (
    <div className="relative flex h-full w-full items-stretch gap-[3px] sm:gap-1.5">
      {visible.map((column, reel) => (
        <DedeColumn
          key={reel}
          reel={reel}
          column={column}
          landing={landing?.[reel] || null}
          rolling={rolling}
          spinKey={spinKey}
          drops={drops}
          winCells={winCells}
          explodeCells={explodeCells}
          strikeCells={strikeCells}
          strikeTone={strikeTone}
          explode={explode}
        />
      ))}
    </div>
  );
}