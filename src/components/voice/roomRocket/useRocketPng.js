import { useEffect, useState } from 'react';
import { ROCKET_ART } from '@/components/voice/roomRocket/rocketArtwork';

const cache = new Map();
function prepare(art) {
  if (!cache.has(art.src)) cache.set(art.src, new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(canvas.width / 1000, canvas.height / 1000);
      ctx.clip(new Path2D(art.mask));
      ctx.drawImage(image, 0, 0, 1000, 1000);
      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Roket görseli yüklenemedi.'));
    image.src = art.src;
  }));
  return cache.get(art.src);
}

// A silhouette mask retains the original rocket pixels, including black and gold,
// instead of keying out those colours along with the galaxy background.
export default function useRocketPng(level) {
  const [result, setResult] = useState(null);
  const art = ROCKET_ART[level - 1] || ROCKET_ART[0];
  useEffect(() => {
    let active = true;
    prepare(art).then(
      src => { if (active) setResult({ source: art.src, src }); },
      () => { if (active) setResult({ source: art.src, src: art.src }); },
    );
    return () => { active = false; };
  }, [art]);
  return result?.source === art.src ? result.src : null;
}