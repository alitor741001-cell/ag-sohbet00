import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';

const cache = new Map();

function makeTransparent(src) {
  if (cache.has(src)) return cache.get(src);
  const task = new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = pixels;
      const seen = new Uint8Array(width * height), queue = [];
      const add = (pixel) => { if (pixel >= 0 && pixel < width * height && !seen[pixel]) { seen[pixel] = 1; queue.push(pixel); } };
      for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1); }
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const pixel = queue[cursor], offset = pixel * 4;
        const brightness = Math.max(data[offset], data[offset + 1], data[offset + 2]);
        if (brightness > 125) continue;
        data[offset + 3] = brightness <= 38 ? 0 : Math.min(data[offset + 3], Math.round(((brightness - 38) / 87) * 255));
        const x = pixel % width;
        if (x > 0) add(pixel - 1);
        if (x < width - 1) add(pixel + 1);
        add(pixel - width); add(pixel + width);
      }
      context.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = src;
  });
  cache.set(src, task);
  return task;
}

export default function TransparentWelcomeImage({ src, ...props }) {
  const [cleanSrc, setCleanSrc] = useState('');
  useEffect(() => { let active = true; makeTransparent(src).then((url) => active && setCleanSrc(url)); return () => { active = false; }; }, [src]);
  return cleanSrc ? <Image src={cleanSrc} {...props} /> : null;
}