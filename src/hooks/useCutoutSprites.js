import { useEffect, useState } from 'react';

// Tasarım görselleri eşit hücrelere bölünür, her hücrenin beyaz zemini şeffaf yapılır:
// her düğme kendi şeffaf PNG parçası olur. Hücreler eşit olduğu için düğmeler eşit boyutta kalır.
const cache = new Map();

// Zemindeki renk düğmenin kendi köşesinden okunur: beyaz ya da açık desenli zemin
// (arkadaşlar/ayarlar tasarımının arkası) ne olursa olsun kaldırılır.
function backgroundTone(ctx, w, h) {
  const corners = [
    ctx.getImageData(0, 0, 1, 1).data,
    ctx.getImageData(w - 1, 0, 1, 1).data,
    ctx.getImageData(0, h - 1, 1, 1).data,
    ctx.getImageData(w - 1, h - 1, 1, 1).data,
  ];
  return corners.reduce((best, current) => (current[0] + current[1] + current[2] > best[0] + best[1] + best[2] ? current : best), corners[0]);
}

const differs = (px, i, tone, limit) => (
  Math.abs(px[i] - tone[0]) > limit
  || Math.abs(px[i + 1] - tone[1]) > limit
  || Math.abs(px[i + 2] - tone[2]) > limit
);

// Hücrenin kenarlarından başlayan zemin şeffaf yapılır; düğmenin içindeki renkler korunur.
function clearBackground(ctx, w, h) {
  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;
  const tone = backgroundTone(ctx, w, h);
  const cleared = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x += 1) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (cleared[p]) continue;
    cleared[p] = 1;
    const i = p * 4;
    if (differs(px, i, tone, 46)) continue;
    px[i + 3] = 0;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  // Kenar geçişlerinde kalan soluk iz de temizlenir: düğmenin çevresinde kutu görünmez.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let p = 0; p < w * h; p += 1) {
      if (px[p * 4 + 3] === 0) continue;
      if (differs(px, p * 4, tone, 78)) continue;
      const x = p % w;
      const touched = (x > 0 && px[(p - 1) * 4 + 3] === 0)
        || (x < w - 1 && px[(p + 1) * 4 + 3] === 0)
        || (p >= w && px[(p - w) * 4 + 3] === 0)
        || (p < w * (h - 1) && px[(p + w) * 4 + 3] === 0);
      if (touched) px[p * 4 + 3] = 0;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function buildTiles(image, cols, rows) {
  const width = Math.floor(image.naturalWidth / cols);
  const height = Math.floor(image.naturalHeight / rows);
  const tiles = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, col * width, row * height, width, height, 0, 0, width, height);
      clearBackground(ctx, width, height);
      tiles.push({ src: canvas.toDataURL('image/png'), ratio: width / height });
    }
  }
  return tiles;
}

function useTiles(url, cols, rows) {
  const key = `${url}|${cols}x${rows}`;
  const [tiles, setTiles] = useState(() => cache.get(key) || []);

  useEffect(() => {
    if (cache.has(key)) { setTiles(cache.get(key)); return undefined; }
    let alive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const result = buildTiles(image, cols, rows);
        cache.set(key, result);
        if (alive) setTiles(result);
      } catch {
        if (alive) setTiles([]);
      }
    };
    image.onerror = () => { if (alive) setTiles([]); };
    image.src = url;
    return () => { alive = false; };
  }, [key]);

  return tiles;
}

/** Tek satırlık tasarım görselini eşit düğmelere böler. */
export default function useCutoutSprites(url, count) {
  return useTiles(url, count, 1);
}

/** Çok satırlı tasarım görselini satır satır eşit düğmelere böler. */
export function useCutoutGrid(url, cols, rows) {
  return useTiles(url, cols, rows);
}