import React, { useMemo, useRef } from 'react';
import SekerliSymbol from './SekerliSymbol';
import { ROWS } from './sekerliConfig';
import { randomSymbol } from './sekerliBoard';

// Görünür alanın üstünde akan sembol sayısı.
const ROLL_ROWS = 7;
// Sonucun üzerine iniş süresi: sütun başına artar, hepsi aynı anda durmaz.
const DURATION_BASE = 980;
const DURATION_STEP = 100;
// Sonuç beklenirken şerit bu tempoda döner: bir tur tam yedi satır kayar.
const ROLL_LOOP_MS = 180;

/**
 * Tek makara: sonuç gelene kadar şerit döngüde akar, sonuç gelince akış hiç
 * kesilmeden gerçek sembollerin üzerine iner. Böylece makara durduğu yerde
 * sembol değişmez: ekranda görünen dizilim turun sonucuyla aynıdır.
 */
export default function SekerliReel({ reel, column, landing, spinning, stopping, winCells, newCells, phase, spinKey }) {
  const duration = DURATION_BASE + reel * DURATION_STEP;
  const rows = ROLL_ROWS + ROWS;
  const startedRef = useRef(0);
  // Şeridin içeriği tur boyunca sabit kalır; turun başlangıcı da burada damgalanır
  // ki iniş animasyonu döngünün gerçek konumundan devam etsin.
  const rollStrip = useMemo(() => {
    startedRef.current = Date.now();
    return Array.from({ length: ROLL_ROWS }, () => randomSymbol());
  }, [spinKey]);

  // İniş, döngünün o anki konumundan başlar: geçişte görünür sıçrama olmaz.
  const from = useMemo(() => {
    if (!landing || !startedRef.current) return 0;
    const phaseAt = ((Date.now() - startedRef.current) % ROLL_LOOP_MS) / ROLL_LOOP_MS;
    return -phaseAt * 50;
  }, [landing, spinKey]);

  if (spinning && !stopping) {
    return (
      <div className="sl-reel">
        {landing ? (
          <div
            className="sl-strip"
            style={{
              '--sl-rows': rows,
              '--sl-from': `${from.toFixed(4)}%`,
              '--sl-roll': `-${((ROLL_ROWS / rows) * 100).toFixed(4)}%`,
              '--sl-dur': `${duration}ms`,
            }}
          >
            {/* Şerit: akan semboller ve altta yerine oturacak sonuç sembolleri. */}
            {[...rollStrip, ...landing].map((sym, index) => (
              <span key={`${spinKey}-${index}`} className="sl-cell sl-cell-roll">
                <SekerliSymbol id={sym} />
              </span>
            ))}
          </div>
        ) : (
          <div
            className="sl-strip sl-strip-wait"
            style={{ '--sl-rows': ROLL_ROWS * 2, '--sl-dur': `${ROLL_LOOP_MS}ms` }}
          >
            {/* Kusursuz döngü: içerik iki kez yazılır, şerit yarım boy kayıp başa döner. */}
            {[...rollStrip, ...rollStrip].map((sym, index) => (
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