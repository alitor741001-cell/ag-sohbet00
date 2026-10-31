import { useEffect, useState } from 'react';
import { borderWhiteCutout, trimTransparent } from '@/lib/whiteCutout';

// Tasarım görseli eşit hücrelere bölünür ve her hücrenin beyaz zemini şeffaf yapılır:
// düğmeler şeffaf PNG olur, arkalarında beyaz kutu kalmaz. Hücreler eşit olduğu için
// düğmeler her satırda aynı boyutta durur. Kırpma açıksa hücrenin şeffaf kenar
// boşlukları da atılır: düğme, çevresindeki tasarım olmadan kendi boyutunda görünür.
const cache = new Map();

function useTiles(url, cols, rows, trim) {
  const key = `${url}|${cols}x${rows}|${trim ? 'trim' : 'full'}`;
  const [tiles, setTiles] = useState(() => cache.get(key) || []);

  useEffect(() => {
    if (cache.has(key)) { setTiles(cache.get(key)); return undefined; }
    let alive = true;
    const crops = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        crops.push({ x: col / cols, y: row / rows, w: 1 / cols, h: 1 / rows });
      }
    }
    Promise.all(crops.map((crop) => borderWhiteCutout(url, crop)
      .then((src) => (trim ? trimTransparent(src) : src))
      .catch(() => '')))
      .then((sources) => {
        const result = sources.filter(Boolean).map((src) => ({ src }));
        if (!result.length) return;
        cache.set(key, result);
        if (alive) setTiles(result);
      });
    return () => { alive = false; };
  }, [key]);

  return tiles;
}

/** Tek satırlık tasarım görselini eşit düğmelere böler. */
export default function useCutoutSprites(url, count, trim = false) {
  return useTiles(url, count, 1, trim);
}

/** Çok satırlı tasarım görselini satır satır eşit düğmelere böler. */
export function useCutoutGrid(url, cols, rows, trim = false) {
  return useTiles(url, cols, rows, trim);
}