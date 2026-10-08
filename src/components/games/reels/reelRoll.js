import { useMemo, useRef } from 'react';

/**
 * Ortak makara altyapısı (Şekerli Meyve'den çıkarıldı).
 *
 * Tur boyunca makaralar kesintisiz döner; sunucunun sonucu gelince şerit tam
 * sonucun üzerine iner. Böylece makara durduktan sonra sembol bir anda değişmez:
 * ekranda duran dizilim, sunucudan gelen dizilimin aynısıdır.
 */

// Görünür alanın üstünde akan dolgu satırı sayısı.
export const ROLL_ROWS = 7;
// Bekleme döngüsü: bir turda tam ROLL_ROWS satır kayar.
export const ROLL_LOOP_MS = 180;
// İniş süresi: her sütun biraz daha geç durur.
const DURATION_BASE = 980;
const DURATION_STEP = 100;

export const reelDuration = (reel) => DURATION_BASE + reel * DURATION_STEP;

/** Tur beklemesi: en uzun sütunun inişi ve küçük bir pay. */
export const landMs = (columns) => reelDuration(Math.max(0, columns - 1)) + 70;

/**
 * Tek sütunun şerit akışı.
 * reel: sütun sırası · spinKey: tur anahtarı · landing: sunucudan gelen sütun
 * rows: görünür satır sayısı · symbols: dolgu sembollerinin listesi (sabit).
 */
export default function useReelRoll({ reel, spinKey, landing, rows, symbols }) {
  const startedRef = useRef(0);
  // Dolgu satırları tur boyunca sabit kalır; turun başlangıcı da burada damgalanır.
  const filler = useMemo(() => {
    startedRef.current = Date.now();
    return Array.from({ length: ROLL_ROWS }, () => symbols[Math.floor(Math.random() * symbols.length)]);
  }, [spinKey, symbols]);

  // İniş şeridi: dolgu satırları ve altında sunucunun sonucu.
  const total = ROLL_ROWS + rows;

  // İniş, döngünün o anki konumundan başlar. Döngü bir turda ROLL_ROWS satır
  // kayar; bu hiza iniş şeridinin kendi yüksekliğine (total satır) çevrilir,
  // böylece geçişte makara aynı yerden devam eder ve sıçrama olmaz.
  const from = useMemo(() => {
    if (!landing || !startedRef.current) return 0;
    const phase = ((Date.now() - startedRef.current) % ROLL_LOOP_MS) / ROLL_LOOP_MS;
    return -((phase * ROLL_ROWS) / total) * 100;
  }, [landing, spinKey, total]);

  return {
    // Bekleme şeridi: içerik iki kez yazılır, yarım boy kayınca başa döner.
    waiting: [...filler, ...filler],
    waitingRows: ROLL_ROWS * 2,
    // İniş şeridi: dolgu satırları ve altında sunucunun sonucu.
    landingTiles: landing ? [...filler, ...landing] : null,
    landingRows: total,
    from: `${from.toFixed(4)}%`,
    to: `-${((ROLL_ROWS / total) * 100).toFixed(4)}%`,
    duration: reelDuration(reel),
    loopMs: ROLL_LOOP_MS,
  };
}