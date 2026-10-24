import { useEffect, useState } from 'react';

const ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/35f44bac4_IMG_0196.jpg';
// Gönderilen tasarımdan kesilen parçalar (görsel genişliği/yüksekliği oranında).
const SLICES = {
  top: { x: 0.01, y: 0.075, w: 0.975, h: 0.103 },
  chip: { x: 0.01, y: 0.174, w: 0.448, h: 0.058 },
  bottom: { x: 0.01, y: 0.826, w: 0.98, h: 0.135 },
};
let cache = null;
let pending = null;

function build() {
  pending = pending || new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const out = {};
      Object.entries(SLICES).forEach(([key, s]) => {
        const sx = Math.round(s.x * img.naturalWidth), sy = Math.round(s.y * img.naturalHeight);
        const w = Math.round(s.w * img.naturalWidth), h = Math.round(s.h * img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        // Beyaz zemin şeffaflaştırılır: tasarım odanın temasının üstünde PNG gibi durur.
        for (let i = 0; i < px.length; i += 4) {
          const min = Math.min(px[i], px[i + 1], px[i + 2]);
          if (min > 232) px[i + 3] = 0;
          else if (min > 195) px[i + 3] = Math.round(((232 - min) / 37) * 255);
        }
        ctx.putImageData(data, 0, 0);
        out[key] = { src: canvas.toDataURL('image/png'), ratio: `${w} / ${h}` };
      });
      cache = out;
      resolve(out);
    };
    img.src = ART;
  });
  return pending;
}

export default function useRoomBarArt(key) {
  const [art, setArt] = useState(cache?.[key] || null);
  useEffect(() => { if (!art) build().then((all) => setArt(all[key])); }, [art, key]);
  return art;
}