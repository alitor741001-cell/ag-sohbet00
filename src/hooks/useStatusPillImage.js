import { useEffect, useState } from 'react';

/**
 * Durum şeridi görselindeki örnek yazılar (sarı metin ve sayaç rakamları) silinir.
 * Yazı pikselleri koyu zemin rengine boyanır, kenar kalıntıları bir piksel taşırılarak temizlenir.
 */
const isTextPixel = (r, g, b) => r > 90 && g > 72 && r - b > 35 && g - b > 20 && b < 215;

export default function useStatusPillImage(url) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = image.data;
      const n = canvas.width * canvas.height;

      let br = 0, bg = 0, bb = 0, count = 0;
      for (let i = 0; i < n; i += 1) {
        const p = i * 4;
        if (d[p] + d[p + 1] + d[p + 2] < 90) { br += d[p]; bg += d[p + 1]; bb += d[p + 2]; count += 1; }
      }
      const fr = count ? Math.round(br / count) : 8;
      const fg = count ? Math.round(bg / count) : 8;
      const fb = count ? Math.round(bb / count) : 8;

      const mask = new Uint8Array(n);
      for (let i = 0; i < n; i += 1) {
        const p = i * 4;
        if (isTextPixel(d[p], d[p + 1], d[p + 2])) mask[i] = 1;
      }
      const w = canvas.width;
      const h = canvas.height;
      const wide = new Uint8Array(mask);
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = y * w + x;
          if (mask[i]) continue;
          if ((x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w])) wide[i] = 1;
        }
      }
      for (let i = 0; i < n; i += 1) {
        if (!wide[i]) continue;
        const p = i * 4;
        d[p] = fr; d[p + 1] = fg; d[p + 2] = fb; d[p + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      setSrc(canvas.toDataURL('image/png'));
    };
    img.src = url;
    return () => { alive = false; };
  }, [url]);

  return src;
}