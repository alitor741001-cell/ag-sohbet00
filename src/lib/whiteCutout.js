import { useEffect, useState } from 'react';

const cache = new Map();

/** Beyaz zeminli görseli kırpar ve beyazı yumuşak kenarla şeffaf yapar. */
export function whiteCutout(url, crop = { x: 0, y: 0, w: 1, h: 1 }) {
  const key = JSON.stringify([url, crop]);
  if (cache.has(key)) return cache.get(key);
  const task = new Promise((resolve, reject) => {
    const img = new window.Image(); img.crossOrigin = 'anonymous';
    img.onerror = reject;
    img.onload = () => {
      const sx = crop.x * img.width, sy = crop.y * img.height, sw = crop.w * img.width, sh = crop.h * img.height;
      const c = document.createElement('canvas'); c.width = Math.round(sw); c.height = Math.round(sh);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const min = Math.min(p[i], p[i + 1], p[i + 2]);
        if (min > 240) {
          const a = Math.max(0, Math.min(1, (255 - min) / 15));
          p[i + 3] = Math.round(p[i + 3] * a);
        }
      }
      ctx.putImageData(d, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.src = url;
  });
  cache.set(key, task);
  return task;
}

export function useWhiteCutout(url, crop) {
  const [src, setSrc] = useState('');
  const sig = JSON.stringify(crop);
  useEffect(() => {
    let alive = true;
    whiteCutout(url, crop).then(s => alive && setSrc(s)).catch(() => alive && setSrc(''));
    return () => { alive = false; };
  }, [url, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}

/**
 * Yalnızca görselin dışındaki beyaz zemini şeffaf yapar; içindeki beyaz yazılar korunur.
 * Kenarlardan başlayıp birbirine bağlı beyaz pikselleri siler.
 */
export function borderWhiteCutout(url, crop = { x: 0, y: 0, w: 1, h: 1 }) {
  const key = JSON.stringify(['border', url, crop]);
  if (cache.has(key)) return cache.get(key);
  const task = new Promise((resolve, reject) => {
    const img = new window.Image(); img.crossOrigin = 'anonymous';
    img.onerror = reject;
    img.onload = () => {
      const sx = crop.x * img.width, sy = crop.y * img.height, sw = crop.w * img.width, sh = crop.h * img.height;
      const c = document.createElement('canvas'); c.width = Math.round(sw); c.height = Math.round(sh);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const { width: w, height: h } = c;
      const d = ctx.getImageData(0, 0, w, h); const p = d.data;
      const isWhite = (i) => Math.min(p[i], p[i + 1], p[i + 2]) > 232;
      const seen = new Uint8Array(w * h);
      const stack = [];
      for (let x = 0; x < w; x += 1) { stack.push(x); stack.push((h - 1) * w + x); }
      for (let y = 0; y < h; y += 1) { stack.push(y * w); stack.push(y * w + w - 1); }
      while (stack.length) {
        const index = stack.pop();
        if (seen[index]) continue;
        seen[index] = 1;
        const i = index * 4;
        if (!isWhite(i)) continue;
        p[i + 3] = 0;
        const x = index % w; const y = (index - x) / w;
        if (x > 0) stack.push(index - 1);
        if (x < w - 1) stack.push(index + 1);
        if (y > 0) stack.push(index - w);
        if (y < h - 1) stack.push(index + w);
      }
      ctx.putImageData(d, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.src = url;
  });
  cache.set(key, task);
  return task;
}

export function useBorderWhiteCutout(url, crop) {
  const [src, setSrc] = useState('');
  const sig = JSON.stringify(crop);
  useEffect(() => {
    let alive = true;
    borderWhiteCutout(url, crop).then(s => alive && setSrc(s)).catch(() => alive && setSrc(''));
    return () => { alive = false; };
  }, [url, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}