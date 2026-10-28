import { useEffect, useState } from 'react';

const SOURCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3c212c019_IMG_0373.jpg';
let cached;

/** Gönderilen şeridi dış zeminden ayırır; gerçek alfa kanallı PNG üretir. */
export default function useVoiceBarPng() {
  const [src, setSrc] = useState(cached || null);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 974; canvas.height = 136;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(38, 0); ctx.lineTo(936, 0);
      ctx.quadraticCurveTo(974, 0, 974, 38); ctx.lineTo(974, 98);
      ctx.quadraticCurveTo(974, 136, 936, 136); ctx.lineTo(38, 136);
      ctx.quadraticCurveTo(0, 136, 0, 98); ctx.lineTo(0, 38);
      ctx.quadraticCurveTo(0, 0, 38, 0); ctx.closePath(); ctx.clip();
      ctx.drawImage(image, 25, 107, 974, 136, 0, 0, 974, 136);
      // Örnekte basılı bildirim yerine gerçek okunmamış mesaj sayısı gösterilir.
      ctx.fillStyle = '#10090d';
      ctx.beginPath(); ctx.arc(650, 39, 16, 0, Math.PI * 2); ctx.fill();
      cached = canvas.toDataURL('image/png');
      if (alive) setSrc(cached);
    };
    image.src = SOURCE;
    return () => { alive = false; };
  }, []);
  return src;
}