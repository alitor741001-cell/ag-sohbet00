import { useEffect, useState } from 'react';
import { borderWhiteCutout, trimTransparent } from '@/lib/whiteCutout';

const cache = new Map();
export default function useCutoutRegions(url, regions) {
  const key = JSON.stringify([url, regions]);
  const [images, setImages] = useState(() => cache.get(key) || []);
  useEffect(() => {
    let alive = true;
    if (cache.has(key)) { setImages(cache.get(key)); return; }
    Promise.all(regions.map((crop) => borderWhiteCutout(url, crop).then(trimTransparent)))
      .then((result) => { cache.set(key, result); if (alive) setImages(result); });
    return () => { alive = false; };
  }, [key]);
  return images;
}