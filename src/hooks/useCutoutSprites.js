import { useEffect, useState } from 'react';

// Tasarım görselindeki beyaz zemin şeffaf yapılır ve görsel düğme dilimlerine ayrılır:
// her düğme kendi şeffaf PNG parçası olur.
const cache = new Map();

const isWhite = (r, g, b) => r > 232 && g > 232 && b > 232;

function toCanvas(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvas;
}

// Her sütun ve satırdaki dolu piksel yoğunluğu: beyaz şeritler düğme aralarıdır.
function densityOf(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const col = new Array(w).fill(0);
  const row = new Array(h).fill(0);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (px[i + 3] === 0 || isWhite(px[i], px[i + 1], px[i + 2])) continue;
      col[x] += 1;
      row[y] += 1;
    }
  }
  return { col, row };
}

// Dolu bölgeleri gruplar; küçük boşluklar aynı düğmeye aittir.
function bands(density, total, count, minRatio = 0.02) {
  const peak = Math.max(...density, 1);
  const active = density.map((value) => value > Math.max(1, peak * 0.015));
  const gap = Math.round(total * 0.006);
  const runs = [];
  let start = -1;
  for (let i = 0; i <= total; i += 1) {
    if (i < total && active[i]) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  const merged = [];
  runs.forEach((run) => {
    const last = merged[merged.length - 1];
    if (last && run[0] - last[1] <= gap) last[1] = run[1];
    else merged.push([...run]);
  });
  const usable = merged.filter(([left, right]) => right - left >= total * minRatio);
  if (usable.length !== count) {
    const cell = Math.floor(total / count);
    return Array.from({ length: count }, (_, index) => [index * cell, cell]);
  }
  return usable.map(([left, right]) => [left, right - left + 1]);
}

function cutCanvas(canvas, sx, sy, sw, sh) {
  const piece = document.createElement('canvas');
  piece.width = sw;
  piece.height = sh;
  const ctx = piece.getContext('2d');
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  const data = ctx.getImageData(0, 0, sw, sh);
  const px = data.data;

  // Kenarlardan başlayan beyaz zemin şeffaf yapılır; düğmenin içindeki beyaz korunur.
  const seen = new Uint8Array(sw * sh);
  const stack = [];
  for (let x = 0; x < sw; x += 1) { stack.push(x, (sh - 1) * sw + x); }
  for (let y = 0; y < sh; y += 1) { stack.push(y * sw, y * sw + sw - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isWhite(px[i], px[i + 1], px[i + 2])) continue;
    px[i + 3] = 0;
    const x = p % sw;
    if (x > 0) stack.push(p - 1);
    if (x < sw - 1) stack.push(p + 1);
    if (p >= sw) stack.push(p - sw);
    if (p < sw * (sh - 1)) stack.push(p + sw);
  }
  ctx.putImageData(data, 0, 0);

  // Görünür alanın sınırları: düğmenin çevresindeki boşluk atılır.
  let left = sw; let top = sh; let right = -1; let bottom = -1;
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      if (px[(y * sw + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0 || bottom < 0) return null;

  const cw = right - left + 1;
  const ch = bottom - top + 1;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(piece, left, top, cw, ch, 0, 0, cw, ch);
  return { src: out.toDataURL('image/png') };
}

function buildGrid(image, cols, rows) {
  const canvas = toCanvas(image);
  const { col, row } = densityOf(canvas);
  const rowBands = bands(row, canvas.height, rows);
  const cells = [];
  rowBands.forEach(([sy, sh]) => {
    const piece = document.createElement('canvas');
    piece.width = canvas.width;
    piece.height = sh;
    piece.getContext('2d').drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
    const colBands = bands(col, canvas.width, cols);
    colBands.forEach(([sx, sw]) => cells.push(cutCanvas(piece, sx, 0, sw, sh)));
  });
  return cells;
}

function useSprites(key, load) {
  const [sprites, setSprites] = useState(() => cache.get(key) || []);
  useEffect(() => {
    if (cache.has(key)) { setSprites(cache.get(key)); return undefined; }
    let alive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const result = load(image).filter(Boolean);
        cache.set(key, result);
        if (alive) setSprites(result);
      } catch {
        if (alive) setSprites([]);
      }
    };
    image.src = key.split('|')[0];
    return () => { alive = false; };
  }, [key]);
  return sprites;
}

/** Tek satırlık tasarımı eşit düğmelere böler; düğmeler arasındaki boşluktan keser. */
export default function useCutoutSprites(url, count) {
  const key = `${url}|${count}x1`;
  return useSprites(key, (image) => buildGrid(image, count, 1));
}

/** Çok satırlı tasarımı satır ve sütun boşluklarından kesip düğmelere böler. */
export function useCutoutGrid(url, cols, rows) {
  const key = `${url}|${cols}x${rows}`;
  return useSprites(key, (image) => buildGrid(image, cols, rows));
}