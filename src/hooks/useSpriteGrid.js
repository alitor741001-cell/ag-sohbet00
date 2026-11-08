import { useEffect, useState } from 'react';
import { borderWhiteCutout, trimTransparent } from '@/lib/whiteCutout';

// 4x4 tasarım görselini eşit parçalara bölmek düğmeleri kesiyordu. Burada sınırlar
// görseldeki gerçek beyaz boşluklardan (oluk) bulunur: düğmeler arasındaki en boş
// sütun/satır sınırdır, böylece hiçbir düğme kırpılmaz.

const cache = new Map();
const MAX_WIDTH = 1200;
const ROWS = 4;
const COLS = 4;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const isStrong = (p, i) => {
  const r = p[i]; const g = p[i + 1]; const b = p[i + 2];
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  return max - min > 45 || max < 150;
};

// Bir eksende içeriğin başladığı/bittiği aralığı ve boşlukları ölçer.
function contentSpan(profile, threshold) {
  let first = -1; let last = -1;
  profile.forEach((value, i) => {
    if (value > threshold) { if (first < 0) first = i; last = i; }
  });
  return { first: Math.max(first, 0), last: Math.max(last, 0) };
}

// Verilen aralıkta en boş çizgiyi (düğmeler arası beyaz boşluk) bulur.
function gutterBetween(profile, from, to) {
  let best = Math.round((from + to) / 2);
  let bestValue = Infinity;
  for (let i = Math.max(1, from); i < Math.min(profile.length - 1, to); i += 1) {
    const value = profile[i];
    if (value < bestValue) { bestValue = value; best = i; }
  }
  return best;
}

function analyze(img) {
  const scale = Math.min(1, MAX_WIDTH / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const p = ctx.getImageData(0, 0, w, h).data;
  const strong = new Uint8Array(w * h);
  for (let i = 0, px = 0; i < p.length; i += 4, px += 1) strong[px] = isStrong(p, i) ? 1 : 0;

  const col = new Array(w).fill(0);
  const row = new Array(h).fill(0);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (strong[y * w + x]) { col[x] += 1; row[y] += 1; }
    }
  }

  const axisBounds = (profile, size, count) => {
    const { first, last } = contentSpan(profile, 1);
    const span = Math.max(last - first, count);
    const bounds = [0];
    for (let i = 1; i < count; i += 1) {
      const expected = first + (span * i) / count;
      const window = span * 0.16;
      bounds.push(gutterBetween(profile, Math.round(expected - window), Math.round(expected + window)));
    }
    bounds.push(size);
    // Sıralı ve artan olmalı
    for (let i = 1; i < bounds.length - 1; i += 1) {
      if (bounds[i] <= bounds[i - 1] + 2) bounds[i] = bounds[i - 1] + 3;
    }
    return bounds;
  };

  const xBounds = axisBounds(col, w, COLS);
  const yBounds = axisBounds(row, h, ROWS);

  const filled = [];
  for (let r = 0; r < ROWS; r += 1) {
    filled.push([]);
    for (let c = 0; c < COLS; c += 1) {
      let sum = 0;
      for (let y = yBounds[r]; y < yBounds[r + 1]; y += 1) {
        for (let x = xBounds[c]; x < xBounds[c + 1]; x += 1) sum += strong[y * w + x];
      }
      filled[r].push(sum > 40);
    }
  }

  return {
    xBounds: xBounds.map((v) => v / w),
    yBounds: yBounds.map((v) => v / h),
    filled,
  };
}

/**
 * Tasarım görselini gerçek düğme boşluklarından bölüp her hücreyi şeffaf PNG yapar.
 * Dönen değer satır satır görsel listesidir; boş hücre null olur.
 */
export default function useSpriteGrid(url) {
  const [rows, setRows] = useState(() => cache.get(url) || null);

  useEffect(() => {
    if (!url) return undefined;
    if (cache.has(url)) { setRows(cache.get(url)); return undefined; }
    let alive = true;
    loadImage(url)
      .then((img) => {
        const grid = analyze(img);
        const tasks = [];
        for (let r = 0; r < ROWS; r += 1) {
          for (let c = 0; c < COLS; c += 1) {
            if (!grid.filled[r][c]) { tasks.push(Promise.resolve(null)); continue; }
            const crop = {
              x: grid.xBounds[c],
              y: grid.yBounds[r],
              w: grid.xBounds[c + 1] - grid.xBounds[c],
              h: grid.yBounds[r + 1] - grid.yBounds[r],
            };
            tasks.push(borderWhiteCutout(url, crop).then(trimTransparent).catch(() => null));
          }
        }
        return Promise.all(tasks);
      })
      .then((tiles) => {
        if (!tiles) return;
        const result = [];
        for (let r = 0; r < ROWS; r += 1) result.push(tiles.slice(r * COLS, r * COLS + COLS));
        cache.set(url, result);
        if (alive) setRows(result);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [url]);

  return rows;
}