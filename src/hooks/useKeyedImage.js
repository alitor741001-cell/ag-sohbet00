import { useEffect, useState } from 'react';

const cache = new Map();

// Şeffaf kenar boşluklarını kırpar: görsel kutunun kenarına tam oturur (çentik hizası).
function trimCanvas(canvas) {
  const { width: w, height: h } = canvas;
  const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (px[(y * w + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0 || right < 0) return { url: canvas.toDataURL('image/png'), ratio: w / h };
  const tw = right - left + 1;
  const th = bottom - top + 1;
  if (tw === w && th === h) return { url: canvas.toDataURL('image/png'), ratio: w / h };
  const out = document.createElement('canvas');
  out.width = tw; out.height = th;
  out.getContext('2d').drawImage(canvas, left, top, tw, th, 0, 0, tw, th);
  return { url: out.toDataURL('image/png'), ratio: tw / th };
}

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
        // Kenarlara değmeyen beyaz alanlar (tasarımdaki beyaz yer tutucu daire) şeffaf yapılır:
        // beyaz kutu kalmaz, arkadaki oda zemini görünür.
        if (crop.clearWhiteIslands) {
          const visited = new Uint8Array(w * h);
          let biggest = null;
          for (let start = 0; start < w * h; start += 1) {
            if (visited[start] || px[start * 4 + 3] === 0 || !isBg(start * 4)) continue;
            const cells = [];
            const queue = [start];
            visited[start] = 1;
            while (queue.length) {
              const q = queue.pop();
              if (px[q * 4 + 3] === 0 || !isBg(q * 4)) continue;
              cells.push(q);
              const x = q % w;
              if (x > 0 && !visited[q - 1]) { visited[q - 1] = 1; queue.push(q - 1); }
              if (x < w - 1 && !visited[q + 1]) { visited[q + 1] = 1; queue.push(q + 1); }
              if (q >= w && !visited[q - w]) { visited[q - w] = 1; queue.push(q - w); }
              if (q < w * (h - 1) && !visited[q + w]) { visited[q + w] = 1; queue.push(q + w); }
            }
            if (!biggest || cells.length > biggest.length) biggest = cells;
          }
          if (biggest && biggest.length > w * h * 0.02) biggest.forEach((q) => { px[q * 4 + 3] = 0; });
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
        if (crop.transparentDarkCircles?.length) {
          const keyed = ctx.getImageData(0, 0, w, h);
          crop.transparentDarkCircles.forEach(([cx, cy, radius]) => {
            const centerX = cx * s, centerY = cy * s - sy, r = radius * s;
            for (let y = Math.max(0, Math.floor(centerY - r)); y < Math.min(h, centerY + r); y++) {
              for (let x = Math.max(0, Math.floor(centerX - r)); x < Math.min(w, centerX + r); x++) {
                const i = (y * w + x) * 4;
                if ((x - centerX) ** 2 + (y - centerY) ** 2 <= r * r && Math.max(keyed.data[i], keyed.data[i + 1], keyed.data[i + 2]) < 64) keyed.data[i + 3] = 0;
              }
            }
          });
          ctx.putImageData(keyed, 0, 0);
        }
        resolve(crop.trim ? trimCanvas(canvas) : { url: canvas.toDataURL('image/png'), ratio: w / h });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function useKeyedArt(url, crop) {
  const key = `${url}|${crop.top}|${crop.height}|${crop.trim ? 'trim' : ''}|${crop.clearWhiteIslands ? 'islands' : ''}|${JSON.stringify(crop.holes || [])}|${(crop.erase || []).length}|${JSON.stringify(crop.transparentDarkCircles || [])}`;
  const [art, setArt] = useState(() => cache.get(key) || null);
  useEffect(() => {
    if (cache.has(key)) { setArt(cache.get(key)); return; }
    let alive = true;
    keyImage(url, crop).then((out) => {
      if (!out) return;
      cache.set(key, out);
      if (alive) setArt(out);
    });
    return () => { alive = false; };
  }, [key]);
  return art;
}

export default function useKeyedImage(url, crop) {
  return useKeyedArt(url, crop)?.url || null;
}

/** Şeffaf kenarları kırpılmış görsel + en-boy oranı (görsel kutuyu tam doldurur). */
export function useTrimmedArt(url, crop) {
  return useKeyedArt(url, crop);
}