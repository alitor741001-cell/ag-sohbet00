import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  MIN_SPIN_MS, START_GAP_MS, STOP_GAP_MS, spinDistance, stopDone, stopOffset, stopPlan,
} from './reelMotion';
import '@/styles/reelRoll.css';

const pick = (symbols) => symbols[Math.floor(Math.random() * symbols.length)];
// Eksi değerlerde de 0..size aralığında kalan mod.
const wrap = (value, size) => ((value % size) + size) % size;
const prefersStill = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/**
 * Gerçek makara: kalkışta hafifçe yukarı çekilir, tam hızda aşağı akar; sonuç gelince
 * sırası geldiğinde frenler, sonucu biraz geçip geri sekerek tam yerine oturur.
 * initial: kalkışta ekranda duran sütun · landing: sunucunun sütunu (gelene kadar null)
 */
export default function ReelSpin({ reel, rows, spinKey, landing, initial, symbols, renderSymbol, cellClassName }) {
  const stripRef = useRef(null);
  const motionRef = useRef(null);
  const landingRef = useRef(landing);
  landingRef.current = landing;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const [stopTiles, setStopTiles] = useState(null);

  // Makara bandı: kalkıştaki sütun ve üstündeki dolgular; bant kendi üstüne döner.
  const loopTiles = useMemo(() => {
    const start = initialRef.current;
    const band = Array.from({ length: rows + 3 }, (_, row) => (row < rows && start?.[row]) || pick(symbols));
    return [...band, ...band].map((id, index) => ({ id, key: `t${index}` }));
  }, [spinKey, rows, symbols]);

  useLayoutEffect(() => {
    const band = loopTiles.length / 2;
    const begin = performance.now();
    const earliestStop = begin + MIN_SPIN_MS + reel * STOP_GAP_MS;
    const motion = {
      start: begin + reel * START_GAP_MS,
      earliestStop,
      stopAt: landingRef.current ? earliestStop : null,
      plan: null,
      stopRows: 0,
      still: prefersStill(),
      raf: 0,
    };

    // Şeridi zamana göre yerleştirir; makara tamamen durduğunda true döner.
    motion.place = (time) => {
      const strip = stripRef.current;
      if (!strip) return false;
      if (motion.stopRows) {
        const elapsed = motion.still ? Infinity : time - motion.stopAt;
        const top = 1 + stopOffset(motion.plan, elapsed);
        strip.style.transform = `translate3d(0, ${(-top / motion.stopRows) * 100}%, 0)`;
        return stopDone(motion.plan, elapsed);
      }
      const travel = motion.still ? 0 : spinDistance(time - motion.start);
      strip.style.transform = `translate3d(0, ${(-(band - wrap(travel, band)) / (band * 2)) * 100}%, 0)`;
      if (motion.stopAt !== null && !motion.plan && time >= motion.stopAt) {
        // Duruş anı: ekrandaki semboller aynen korunur, üstlerine sonuç dizilir.
        const at = band - wrap(motion.still ? 0 : spinDistance(motion.stopAt - motion.start), band);
        const base = Math.floor(at);
        motion.plan = stopPlan(rows, at - base);
        setStopTiles([
          { id: pick(symbols), key: 'peek' },
          ...(landingRef.current || []).map((id, index) => ({ id, key: `l${index}` })),
          ...Array.from({ length: motion.plan.bridge }, (_, index) => ({ id: pick(symbols), key: `b${index}` })),
          ...loopTiles.slice(base, base + rows + 1),
        ]);
      }
      return false;
    };

    motionRef.current = motion;
    setStopTiles(null);
    motion.place(begin);
    const tick = (time) => {
      if (motion.place(time)) return;
      motion.raf = requestAnimationFrame(tick);
    };
    motion.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(motion.raf);
  }, [loopTiles, reel, rows, symbols]);

  // Duruş şeridi ekrana bağlandı: çizimden önce doğru konuma oturtulur.
  useLayoutEffect(() => {
    const motion = motionRef.current;
    if (!stopTiles || !motion) return;
    motion.stopRows = stopTiles.length;
    motion.place(performance.now());
  }, [stopTiles]);

  // Sonuç geldi: makara, sırası gelince (soldan sağa) frene girer.
  useEffect(() => {
    const motion = motionRef.current;
    if (!landing || !motion || motion.stopAt !== null) return;
    motion.stopAt = Math.max(performance.now() + reel * STOP_GAP_MS, motion.earliestStop);
  }, [landing, reel]);

  const tiles = stopTiles || loopTiles;
  return (
    <div ref={stripRef} className="rl-strip" style={{ '--rl-visible': String(rows), '--rl-rows': String(tiles.length) }}>
      {tiles.map((tile) => (
        <span key={tile.key} className={cellClassName}>{renderSymbol(tile.id)}</span>
      ))}
    </div>
  );
}