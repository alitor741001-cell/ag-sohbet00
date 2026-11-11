import { useEffect, useState } from 'react';
import { trimTransparent } from '@/lib/whiteCutout';

const cache = new Map();
function prepare(src) {
  if (cache.has(src)) return cache.get(src);
  const task = new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onerror = reject;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(image.width, image.height));
      const w = canvas.width = Math.round(image.width * scale);
      const h = canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h), p = data.data;
      const seen = new Uint8Array(w * h), queue = [];
      const add = (n) => {
        if (seen[n]) return;
        seen[n] = 1;
        const i = n * 4, lo = Math.min(p[i], p[i + 1], p[i + 2]);
        if (p[i + 3] > 16 && !(lo > 220 && Math.max(p[i], p[i + 1], p[i + 2]) - lo < 28)) return;
        p[i + 3] = 0; queue.push(n);
      };
      for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
      for (let head = 0; head < queue.length; head++) {
        const n = queue[head], x = n % w;
        if (x > 0) add(n - 1); if (x < w - 1) add(n + 1);
        if (n >= w) add(n - w); if (n < w * (h - 1)) add(n + w);
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.src = src;
  }).then(trimTransparent);
  cache.set(src, task);
  return task;
}
export default function useProfileIconPng(src) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    if (src) prepare(src).then(url => active && setResult({ src, url })).catch(() => active && setResult({ src, url: src }));
    return () => { active = false; };
  }, [src]);
  return result?.src === src ? result.url : '';
}