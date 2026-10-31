import { useEffect, useState } from 'react';

// Tasarım görselindeki beyaz zemin şeffaf yapılır ve görsel düğme dilimlerine ayrılır:
// her düğme kendi şeffaf PNG parçası olur.
const cache = new Map();

const isWhite = (r, g, b) => r > 232 && g > 232 && b > 232;

function readPixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  return { canvas, ctx, px: ctx.getImageData(0, 0, canvas.width, canvas.height).data, w: canvas.width, h: canvas.height };
}

// Düğmeler arasındaki boş (beyaz) şeritler bulunur: dilimler düğmenin gerçek sınırından kesilir.
function detectRanges(image, count) {
  const { px, w, h } = readPixels(image);
  const density = new Array(w).fill(0);
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (!isWhite(px[i], px[i + 1], px[i + 2])) density[x] += 1;
    }
  }
  const minDensity = Math.max(2, Math.round(h / 200));
  const active = density.map((value) => value > minDensity);

  const runs = [];
  let start = -1;
  for (let x = 0; x <= w; x += 1) {
    if (x < w && active[x]) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }

  // Küçük boşluklar aynı düğmeye aittir: birleştirilir.
  const gap = Math.round(w * 0.006);
  const merged = [];
  runs.forEach((run) => {
    const last = merged[merged.length - 1];
    if (last && run[0] - last[1] <= gap) last[1] = run[1];
    else merged.push([...run]);
  });

  const usable = merged.filter(([left, right]) => right - left >= w * 0.02);
  if (usable.length !== count) {
    const cell = Math.floor(w / count);
    return Array.from({ length: count }, (_, index) => [index * cell, cell]);
  }
  return usable.map(([left, right]) => [left, right - left + 1]);
}

function cutCell(image, sx, sw) {
  const h = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, sx, 0, sw, h, 0, 0, sw, h);
  const data = ctx.getImageData(0, 0, sw, h);
  const px = data.data;

  const seen = new Uint8Array(sw * h);
  const stack = [];
  for (let x = 0; x < sw; x += 1) { stack.push(x, (h - 1) * sw + x); }
  for (let y = 0; y < h; y += 1) { stack.push(y * sw, y * sw + sw - 1); }
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
    if (p < sw * (h - 1)) stack.push(p + sw);
  }
  ctx.putImageData(data, 0, 0);

  // Görünür alanın sınırları: düğmenin çevresindeki boşluk atılır.
  let left = sw; let top = h; let right = -1; let bottom = -1;
  for (let y = 0; y < h; y += 1) {
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
  const cropped = document.createElement('canvas');
  cropped.width = cw;
  cropped.height = ch;
  cropped.getContext('2d').drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
  return { src: cropped.toDataURL('image/png') };
}

function build(image, count) {
  return detectRanges(image, count).map(([sx, sw]) => cutCell(image, sx, sw));
}

/** Bir tasarım görselini şeffaf PNG düğmelere böler. */
export default function useCutoutSprites(url, count) {
  const [sprites, setSprites] = useState(() => cache.get(url) || []);

  useEffect(() => {
    if (cache.has(url)) { setSprites(cache.get(url)); return undefined; }
    let alive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const result = build(image, count);
        cache.set(url, result);
        if (alive) setSprites(result);
      } catch {
        if (alive) setSprites([]);
      }
    };
    image.src = url;
    return () => { alive = false; };
  }, [url, count]);

  return sprites;
}