import { useEffect, useState } from 'react';

const SOURCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/9e599f886_IMG_0375.jpg';
let cached = null;

// Görselin kenarındaki zemin (beyaz) tamamen şeffaf yapılır, kalan kısım kırpılır:
// geriye yalnızca tasarımın kendisi, gerçek alfa kanallı PNG olarak kalır.
function keyBar(image) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // Kenar piksellerinde en sık görülen renk zemin kabul edilir.
  const counts = new Map();
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    const key = `${px[i] >> 4}-${px[i + 1] >> 4}-${px[i + 2] >> 4}`;
    const entry = counts.get(key) || { r: px[i], g: px[i + 1], b: px[i + 2], n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  };
  for (let x = 0; x < w; x += 1) { at(x, 0); at(x, h - 1); }
  for (let y = 0; y < h; y += 1) { at(0, y); at(w - 1, y); }
  const sorted = [...counts.values()].sort((a, b) => b.n - a.n);
  const ground = sorted[0];
  const isBg = (i) => Math.abs(px[i] - ground.r) < 34
    && Math.abs(px[i + 1] - ground.g) < 34
    && Math.abs(px[i + 2] - ground.b) < 34;

  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x += 1) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y += 1) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    px[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  ctx.putImageData(data, 0, 0);

  // Kalan görünür alanın sınırları bulunur ve fazla boşluk atılır.
  let left = w; let top = h; let right = -1; let bottom = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (px[(y * w + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  const cw = right - left + 1;
  const ch = bottom - top + 1;
  if (cw < 8 || ch < 8) return { src: canvas.toDataURL('image/png'), ratio: `${w} / ${h}` };

  const cropped = document.createElement('canvas');
  cropped.width = cw; cropped.height = ch;
  cropped.getContext('2d').drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
  return { src: cropped.toDataURL('image/png'), ratio: `${cw} / ${ch}` };
}

/** Alt çubuk tasarımını şeffaf PNG olarak hazırlar. */
export default function useVoiceBarPng() {
  const [state, setState] = useState(cached || { src: '', ratio: '' });
  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        cached = keyBar(image);
        if (alive) setState(cached);
      } catch (error) {
        if (alive) setState({ src: SOURCE, ratio: `${image.naturalWidth} / ${image.naturalHeight}` });
      }
    };
    image.src = SOURCE;
    return () => { alive = false; };
  }, []);
  return state;
}