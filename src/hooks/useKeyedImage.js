import { useEffect, useState } from 'react';

const cache = new Map();

// Görseldeki açık gri/beyaz dama zemini kenarlardan başlayarak şeffaf yapar
// (içerideki beyaz yazılara dokunmaz). Hata olursa orijinal görsel kullanılır.
function keyImage(url, crop) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const sy = Math.round(img.naturalHeight * crop.top);
        const w = img.naturalWidth;
        const h = Math.round(img.naturalHeight * crop.height);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, sy, w, h, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const isBg = (i) => {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          return Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 28;
        };
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
        // Görsele basılı örnek yazılar (isim, ID, sayılar) koyu zeminle örtülür.
        const s = w / (crop.baseWidth || w);
        ctx.fillStyle = '#0b0a0d';
        (crop.erase || []).forEach(([x, y, ew, eh]) => ctx.fillRect(x * s, y * s - sy, ew * s, eh * s));
        // Delikler: çemberin içi tamamen şeffaf yapılır, arkadaki fotoğraf görünür.
        ctx.globalCompositeOperation = 'destination-out';
        (crop.holes || []).forEach(([cx, cy, r]) => { ctx.beginPath(); ctx.arc(cx * s, cy * s - sy, r * s, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalCompositeOperation = 'source-over';
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function useKeyedImage(url, crop) {
  const key = `${url}|${crop.top}|${crop.height}|${JSON.stringify(crop.holes || [])}|${(crop.erase || []).length}`;
  const [src, setSrc] = useState(() => cache.get(key) || null);
  useEffect(() => {
    if (cache.has(key)) { setSrc(cache.get(key)); return; }
    let alive = true;
    keyImage(url, crop).then((out) => { cache.set(key, out); if (alive) setSrc(out); });
    return () => { alive = false; };
  }, [key]);
  return src;
}