import { useEffect, useState } from 'react';
const URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3dcd0aaa7_IMG_0194.jpg';
let artwork;
function loadArt() {
  if (artwork) return artwork;
  artwork = new Promise(resolve => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onerror = () => resolve('');
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = pixels, seen = new Uint8Array(width * height), queue = [];
        const add = index => {
          if (index < 0 || index >= seen.length || seen[index]) return;
          seen[index] = 1;
          const p = index * 4, min = Math.min(data[p], data[p + 1], data[p + 2]), max = Math.max(data[p], data[p + 1], data[p + 2]);
          if (min > 200 && max - min < 24) queue.push(index);
        };
        for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
        for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1); }
        for (let i = 0; i < queue.length; i++) {
          const index = queue[i]; data[index * 4 + 3] = 0;
          if (index % width) add(index - 1);
          if (index % width < width - 1) add(index + 1);
          add(index - width); add(index + width);
        }
        ctx.putImageData(pixels, 0, 0); resolve(canvas.toDataURL('image/png'));
      } catch { resolve(''); }
    };
    image.src = URL;
  });
  return artwork;
}
export default function useMaleRoomArt(enabled) {
  const [src, setSrc] = useState('');
  useEffect(() => { let active = true; if (enabled) loadArt().then(value => { if (active) setSrc(value); }); return () => { active = false; }; }, [enabled]);
  return src;
}