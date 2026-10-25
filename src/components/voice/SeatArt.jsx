import { useEffect, useState } from 'react';

const SRC = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/eea21aae7_IMG_0309.jpg';
let cached = null;

// Beyaz zemini şeffaflığa çevirir (bir kez yapılır, tüm koltuklar paylaşır).
function makeTransparent() {
  if (cached) return cached;
  cached = new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size);
        const d = data.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = 255 - Math.min(d[i], d[i + 1], d[i + 2]);
          if (a < 6) { d[i + 3] = 0; continue; }
          const k = a / 255;
          d[i] = Math.max(0, Math.min(255, (d[i] - 255 * (1 - k)) / k));
          d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - 255 * (1 - k)) / k));
          d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - 255 * (1 - k)) / k));
          // Şeffaflığı koruyarak koltuk çiziminin kabartmasını buz mavisine boya.
          const shade = 0.65 + 0.35 * (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
          d[i] = Math.round(165 * shade);
          d[i + 1] = Math.round(225 * shade);
          d[i + 2] = Math.round(250 * shade);
          d[i + 3] = a;
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = SRC;
  });
  return cached;
}

/** Boş koltuk görseli: arka planı şeffaf. */
export default function SeatArt({ className = '' }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    makeTransparent().then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, []);
  if (!url) return <span className={className} />;
  return <img src={url} alt="" draggable={false} className={className} />;
}