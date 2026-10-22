import { useEffect, useState } from 'react';

const cache = new Map();

// Yalnız dış kenardaki loş renk saçılmasını nötrleştirir; zemin ve alfa korunur.
function cleanEdges(src) {
  if (cache.has(src)) return cache.get(src);
  const task = new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const w = image.naturalWidth, h = image.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, w, h);
        // Arka plan kenardan taşma doldurmayla silinir: kenardaki zemin rengine
        // yakın bitişik pikseller şeffaf olur, nesnenin kendisi tam opak kalır.
        const rgb = data.data;
        const seed = [0, w - 1, (h - 1) * w, h * w - 1].map(i => [rgb[i * 4], rgb[i * 4 + 1], rgb[i * 4 + 2]]);
        const isBg = i => {
          const r = rgb[i * 4], g = rgb[i * 4 + 1], b = rgb[i * 4 + 2];
          if (Math.max(r, g, b) < 45) return true;
          return seed.some(s => Math.abs(r - s[0]) + Math.abs(g - s[1]) + Math.abs(b - s[2]) < 60);
        };
        const seen = new Uint8Array(w * h);
        const stack = [];
        for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
        for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
        while (stack.length) {
          const i = stack.pop();
          if (seen[i]) continue;
          seen[i] = 1;
          if (!isBg(i)) continue;
          rgb[i * 4 + 3] = 0;
          const x = i % w;
          if (x > 0) stack.push(i - 1);
          if (x < w - 1) stack.push(i + 1);
          if (i >= w) stack.push(i - w);
          if (i < w * (h - 1)) stack.push(i + w);
        }
        ctx.putImageData(data, 0, 0);
        canvas.toBlob(blob => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('Görsel hazırlanamadı')), 'image/png');
      } catch (error) { reject(error); }
    };
    image.onerror = reject;
    image.src = src;
  });
  cache.set(src, task);
  return task;
}

export default function useSlotEdgeCleanup(src) {
  const [result, setResult] = useState({ src, url: src });
  useEffect(() => {
    let active = true;
    cleanEdges(src).then(url => { if (active) setResult({ src, url }); }).catch(() => {});
    return () => { active = false; };
  }, [src]);
  return result.src === src ? result.url : src;
}