import { useEffect, useState } from 'react';

const colors = new Map();
const pending = new Map();
const fallbackColor = (name = '') => {
  const rules = [[/mini.*kalp|pembe/i, '#ff35b5'], [/gül|kalp|rose|heart/i, '#ff303f'], [/ayı|yüzük|ring|bear/i, '#ffc85a'], [/araba|car/i, '#475dff'], [/elmas|diamond/i, '#28caff'], [/şato|castle|galaksi/i, '#bc43ff']];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || '#ffc85a';
};
function sampleColor(url, fallback) {
  if (pending.has(url)) return pending.get(url);
  const task = new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onerror = () => resolve(fallback);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, 32, 32);
        const { data } = context.getImageData(0, 0, 32, 32);
        const bins = Array.from({ length: 24 }, () => ({ score: 0, r: 0, g: 0, b: 0 }));
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b, a] = data.slice(i, i + 4);
          const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
          if (a < 128 || max < 65 || delta < 35) continue;
          let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
          hue = (hue * 60 + 360) % 360;
          const bin = bins[Math.floor(hue / 15)], weight = (delta / max) ** 2 * max;
          bin.score += weight; bin.r += r * weight; bin.g += g * weight; bin.b += b * weight;
        }
        const best = bins.reduce((a, b) => b.score > a.score ? b : a);
        resolve(best.score ? `#${[best.r, best.g, best.b].map(v => Math.round(v / best.score).toString(16).padStart(2, '0')).join('')}` : fallback);
      } catch { resolve(fallback); } // External images may disallow canvas reads.
    };
    image.src = url;
  }).then(color => { colors.set(url, color); return color; });
  pending.set(url, task);
  return task;
}
export default function useGiftArtColor(gift) {
  const fallback = fallbackColor(gift.name);
  const [tone, setTone] = useState(() => colors.get(gift.image_url) || fallback);
  useEffect(() => {
    let active = true;
    setTone(colors.get(gift.image_url) || fallback);
    if (gift.image_url) sampleColor(gift.image_url, fallback).then(color => { if (active) setTone(color); });
    return () => { active = false; };
  }, [gift.image_url, fallback]);
  return tone;
}