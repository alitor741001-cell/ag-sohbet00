import { useEffect, useState } from 'react';

// Kart karesi: görsel kare kırpılır, 512'ye indirilir.
const TILE = 512;
// Zemine bu mesafenin altındaki pikseller zemin sayılır (kare uzaklık).
const NEAR = 34 * 34;
// Zemine komşu yumuşak geçiş kuşağının genişliği.
const SOFT = 84 * 84;
// Karenin dış bandı: hücre çizgileri ve kırpıntılar zemine karıştırılır.
const RING = 0.05;
// Nesne kenara değmesin: kırpma payı ve leke eşiği.
const INSET = 0.9;
const SPECK = 30;

const SUBJECT = new Uint8Array(TILE * TILE);
const SEEN = new Uint8Array(TILE * TILE);
const STACK = new Int32Array(TILE * TILE);

const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Görsel yüklenemedi.'));
    image.src = src;
  });
}

/** Karenin dış bandının medyan rengi: nesnenin korunacak zemin tonu. */
function backgroundTone(pixels) {
  const band = 6;
  const samples = [[], [], []];
  const sample = (x, y) => {
    const p = (y * TILE + x) * 4;
    samples[0].push(pixels[p]);
    samples[1].push(pixels[p + 1]);
    samples[2].push(pixels[p + 2]);
  };
  for (let y = 0; y < TILE; y += 1) {
    for (let edge = 0; edge < band; edge += 1) {
      sample(edge, y);
      sample(TILE - 1 - edge, y);
    }
  }
  for (let x = band; x < TILE - band; x += 1) {
    for (let edge = 0; edge < band; edge += 1) {
      sample(x, edge);
      sample(x, TILE - 1 - edge);
    }
  }
  return samples.map((list) => {
    list.sort((a, b) => a - b);
    return list[list.length >> 1];
  });
}

const distanceTo = (pixels, p, tone) => {
  const red = pixels[p] - tone[0];
  const green = pixels[p + 1] - tone[1];
  const blue = pixels[p + 2] - tone[2];
  return red * red + green * green + blue * blue;
};

const paint = (pixels, p, tone, amount) => {
  for (let channel = 0; channel < 3; channel += 1) {
    pixels[p + channel] = Math.round(pixels[p + channel] * (1 - amount) + tone[channel] * amount);
  }
};

/**
 * Zemin tek renge indirilir: zemine yakın pikseller tam tona çekilir, kuşaktakiler
 * yumuşak geçişle temizlenir. Böylece nesnenin kendi zemini korunur, çevresindeki
 * kirli saçılma ve renk geçişleri kalkar.
 */
function flattenBackground(pixels, tone) {
  for (let p = 0; p < pixels.length; p += 4) {
    const distance = distanceTo(pixels, p, tone);
    if (distance >= SOFT) continue;
    paint(pixels, p, tone, distance <= NEAR ? 1 : 1 - (distance - NEAR) / (SOFT - NEAR));
  }
}

/** Karenin dış bandındaki hücre çizgileri ve kırpıntılar zemine karıştırılır. */
function clearOuterRing(pixels, tone) {
  const ring = Math.round(TILE * RING);
  for (let y = 0; y < ring; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const edge = Math.min(x, y, TILE - 1 - x, TILE - 1 - y);
      const p = (y * TILE + x) * 4;
      paint(pixels, p, tone, 1 - edge / ring);
    }
  }
  for (let y = TILE - ring; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const edge = Math.min(x, y, TILE - 1 - x, TILE - 1 - y);
      const p = (y * TILE + x) * 4;
      paint(pixels, p, tone, 1 - edge / ring);
    }
  }
}

/** Zeminden kopuk küçük lekeler (toz, çizgi artığı) temizlenir. */
function removeSpecks(pixels, tone) {
  const total = TILE * TILE;
  SUBJECT.fill(0);
  SEEN.fill(0);
  for (let index = 0; index < total; index += 1) {
    SUBJECT[index] = distanceTo(pixels, index * 4, tone) > NEAR ? 1 : 0;
  }

  for (let start = 0; start < total; start += 1) {
    if (!SUBJECT[start] || SEEN[start]) continue;
    const members = [start];
    let speck = true;
    let head = 0;
    let tail = 1;
    STACK[0] = start;
    SEEN[start] = 1;
    while (head < tail) {
      const index = STACK[head];
      head += 1;
      const x = index % TILE;
      const y = (index - x) / TILE;
      const neighbours = [
        x > 0 ? index - 1 : -1,
        x < TILE - 1 ? index + 1 : -1,
        y > 0 ? index - TILE : -1,
        y < TILE - 1 ? index + TILE : -1,
      ];
      for (const next of neighbours) {
        if (next < 0 || SEEN[next] || !SUBJECT[next]) continue;
        SEEN[next] = 1;
        STACK[tail] = next;
        tail += 1;
        if (members.length > SPECK) speck = false;
        else members.push(next);
      }
    }
    if (speck) members.forEach((index) => paint(pixels, index * 4, tone, 1));
  }
}

/** Nesnenin kendi pikselleri keskinleştirilir; zemin tek renk kalır. */
function sharpenSubject(pixels, tone) {
  const source = new Uint8ClampedArray(pixels);
  const at = (x, y) => (y * TILE + x) * 4;
  for (let y = 1; y < TILE - 1; y += 1) {
    for (let x = 1; x < TILE - 1; x += 1) {
      const p = at(x, y);
      if (distanceTo(source, p, tone) <= NEAR) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = source[p + channel] * 5
          - source[at(x - 1, y) + channel]
          - source[at(x + 1, y) + channel]
          - source[at(x, y - 1) + channel]
          - source[at(x, y + 1) + channel];
        pixels[p + channel] = value < 0 ? 0 : value > 255 ? 255 : value;
      }
    }
  }
}

async function process(src) {
  const image = await loadImage(src);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('Görsel okunamadı.');

  // Kare kırpma: hücre kenarları kırpılır, nesne ortada ve kenarlardan uzak kalır.
  const side = Math.min(width, height) * INSET;
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, TILE, TILE);

  const imageData = context.getImageData(0, 0, TILE, TILE);
  const pixels = imageData.data;
  const tone = backgroundTone(pixels);
  flattenBackground(pixels, tone);
  clearOuterRing(pixels, tone);
  removeSpecks(pixels, tone);
  sharpenSubject(pixels, tone);

  context.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Görsel işlenemedi.');
  return URL.createObjectURL(blob);
}

/** Kare kart: kare kırpılır, zemini tek renge iner, kenarları temizlenir. */
export function buildEliminTile(src) {
  const found = cache.get(src);
  if (found) return found;
  const task = process(src).then(
    (url) => {
      cache.set(src, url);
      return url;
    },
    (error) => {
      cache.delete(src);
      throw error;
    },
  );
  cache.set(src, task);
  return task;
}

/** Hazır olana kadar görselin kendisi gösterilir. */
export default function useEliminTile(src) {
  const [state, setState] = useState({ src, url: src });
  useEffect(() => {
    const ready = cache.get(src);
    if (typeof ready === 'string') {
      setState({ src, url: ready });
      return undefined;
    }
    let active = true;
    setState({ src, url: src });
    buildEliminTile(src)
      .then((url) => {
        if (active) setState({ src, url });
      })
      // İşleme kısıtlı tarayıcıda başarısız olursa görsel olduğu gibi gösterilir.
      .catch(() => {
        if (active) setState({ src, url: src });
      });
    return () => {
      active = false;
    };
  }, [src]);
  return state.src === src ? state.url : src;
}