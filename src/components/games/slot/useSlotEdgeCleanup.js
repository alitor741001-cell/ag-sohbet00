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
        // Yatağın tonu: kartların dış bandı bu renge kaydırılır, böylece kart
        // kenarı yatağa karışır ve kare sınırı görünmez.
        const BED = [10, 9, 23];
        const band = Math.max(2, Math.round(Math.min(w, h) * 0.035));
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const distance = Math.min(x, y, w - 1 - x, h - 1 - y);
          if (distance >= band) continue;
          const p = (y * w + x) * 4, rgb = data.data;
          const high = Math.max(rgb[p], rgb[p + 1], rgb[p + 2]);
          const low = Math.min(rgb[p], rgb[p + 1], rgb[p + 2]);
          // Parlak sembol çizgileri ve altın çerçeveler değişmez.
          if (high >= 100 || high - low < 12) continue;
          const amount = (1 - distance / band) * (1 - high / 100) * 0.9;
          for (let c = 0; c < 3; c++) rgb[p + c] = Math.round(rgb[p + c] * (1 - amount) + BED[c] * amount);
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