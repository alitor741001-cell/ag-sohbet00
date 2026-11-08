import { useEffect, useState } from 'react';
import { borderWhiteCutout, trimTransparent } from '@/lib/whiteCutout';

// 4x4 tasarım görselini körlemesine eşit parçalara bölmek düğmeleri kesiyordu.
// Burada görselin gerçek boşlukları bulunur: önce satırlar, sonra sütunlar.
// Düğme sınırları iki düğme arasındaki beyaz boşluğun ortasından geçer, böylece
// hiçbir düğme kırpılmaz; sonra her hücrenin beyaz zemini şeffaf yapılır.

const cache = new Map();
const MAX_WIDTH = 1100;
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

function countRuns(values, w, threshold) {
  const runs = [];
  let start = -1;
  for (let i = 0; i <= w; i += 1) {
    const on = i < w && values[i] >= threshold;
    if (on && start < 0) start = i;
    if (!on && start >= 0) { runs.push({ start, end: i }); start = -1; }
  }
  return runs.filter((run) => run.end - run.start > w * 0.03);
}

function mergeTo(runs, max) {
  const list = runs.slice();
  while (list.length > max) {
    let at = 0; let gap = Infinity;
    for (let i = 0; i < list.length - 1; i += 1) {
      const g = list[i + 1].start - list[i].end;
      if (g < gap) { gap = g; at = i; }
    }
    list.splice(at, 2, { start: list[at].start, end: list[at + 1].end });
  }
  return list;
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

  // Satır bantları
  const rowCount = new Array(h).fill(0);
  for (let y = 0; y < h; y += 1) {
    let sum = 0;
    for (let x = 0; x < w; x += 1) sum += strong[y * w + x];
    rowCount[y] = sum;
  }
  const rowRuns = countRuns(rowCount, h, Math.max(2, Math.round(w * 0.01)));
  const bands = mergeTo(rowRuns, ROWS);
  if (bands.length < ROWS) return null;

  // Sütunlar: en çok düğme veren banttan ölçülür, tüm satırlara aynı sınırlar uygulanır
  let cols = [];
  bands.forEach((band) => {
    const counts = new Array(w).fill(0);
    for (let y = band.start; y < band.end; y += 1) {
      for (let x = 0; x < w; x += 1) counts[x] += strong[y * w + x];
    }
    const threshold = Math.max(2, Math.round((band.end - band.start) * 0.25));
    const runs = mergeTo(countRuns(counts, w, threshold), COLS);
    if (runs.length > cols.length) cols = runs;
  });
  if (cols.length < COLS) return null;

  const xBounds = [0];
  for (let i = 0; i < cols.length - 1; i += 1) {
    xBounds.push(Math.round((cols[i].end + cols[i + 1].start) / 2));
  }
  xBounds.push(w);
  const yBounds = [0];
  for (let i = 0; i < bands.length - 1; i += 1) {
    yBounds.push(Math.round((bands[i].end + bands[i + 1].start) / 2));
  }
  yBounds.push(h);

  // Boş hücreler: içinde hiç düğme pikseli olmayanlar
  const filled = [];
  for (let r = 0; r < ROWS; r += 1) {
    filled.push([]);
    for (let c = 0; c < COLS; c += 1) {
      let sum = 0;
      for (let y = yBounds[r]; y < yBounds[r + 1]; y += 1) {
        for (let x = xBounds[c]; x < xBounds[c + 1]; x += 1) sum += strong[y * w + x];
      }
      filled[r].push(sum > 12);
    }
  }

  return {
    xBounds: xBounds.map((v) => v / w),
    yBounds: yBounds.map((v) => v / h),
    filled,
  };
}

/**
 * Tasarım görselini gerçek düğme sınırlarından bölüp her hücreyi şeffaf PNG yapar.
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
        if (!grid) return null;
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