import { useEffect, useState } from 'react';

// Tasarım görselindeki beyaz zemin şeffaf yapılır ve görsel eşit genişlikte
// düğme dilimlerine ayrılır: her düğme kendi şeffaf PNG parçası olur.
const cache = new Map();

function cutCell(image, sx, sw) {
  const h = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, sx, 0, sw, h, 0, 0, sw, h);
  const data = ctx.getImageData(0, 0, sw, h);
  const px = data.data;

  const isBg = (i) => px[i] > 232 && px[i + 1] > 232 && px[i + 2] > 232;

  const seen = new Uint8Array(sw * h);
  const stack = [];
  for (let x = 0; x < sw; x += 1) { stack.push(x, (h - 1) * sw + x); }
  for (let y = 0; y < h; y += 1) { stack.push(y * sw, y * sw + sw - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    px[p * 4 + 3] = 0;
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
  return { src: cropped.toDataURL('image/png'), ratio: ch / cw };
}

function build(image, count) {
  const w = image.naturalWidth;
  const cell = Math.floor(w / count);
  const sprites = [];
  for (let i = 0; i < count; i += 1) {
    sprites.push(cutCell(image, i * cell, cell));
  }
  return sprites;
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