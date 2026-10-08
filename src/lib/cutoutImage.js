import { useEffect, useState } from 'react';

// Zemin saf siyah olabileceği gibi çok koyu gri de olabilir: eşik, görselin kendi
// kenar piksellerinden ölçülür ve zemine uyarlanır.
const BLACK = 32; // en az bu parlaklığın altındaki pikseller zemin sayılır
const SOFT = 56; // zemine komşu yumuşak geçiş kuşağının genişliği (0-255)

// Aynı görsel bir kez işlenir; sonuç uygulama açık kaldığı sürece saklanır.
const cache = new Map();

/**
 * Siyah zeminli görseli tarayıcıda gerçek zamanlı keser ve şeffaf PNG adresi verir.
 * Yalnızca kenardan bağlantılı koyu alan zemin sayılır — gövdenin içindeki koyu
 * detaylar (roket gövdesi, uçak camı) korunur.
 */
export function cutDarkBackground(src) {
  const found = cache.get(src);
  if (found) return typeof found === 'string' ? Promise.resolve(found) : found;
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

/** Görselin şeffaf sürümü hazır olana kadar null döner. */
export default function useCutoutImage(src) {
  const [url, setUrl] = useState(() => (typeof cache.get(src) === 'string' ? cache.get(src) : null));

  useEffect(() => {
    const ready = cache.get(src);
    if (typeof ready === 'string') {
      setUrl(ready);
      return undefined;
    }
    let cancelled = false;
    setUrl(null);
    cutDarkBackground(src)
      .then((next) => {
        if (!cancelled) setUrl(next);
      })
      // Kesme başarısız olursa (kısıtlı tarayıcı) görsel olduğu gibi gösterilir.
      .catch(() => {
        if (!cancelled) setUrl(src);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return url;
}

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

async function process(src) {
  const image = await loadImage(src);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('Görsel okunamadı.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const total = width * height;

  // Parlaklık haritası.
  const lum = new Uint8Array(total);
  for (let index = 0, p = 0; index < total; index += 1, p += 4) {
    lum[index] = (pixels[p] * 0.2126 + pixels[p + 1] * 0.7152 + pixels[p + 2] * 0.0722) | 0;
  }

  // Kenar çemberinin medyan parlaklığı zeminin tonudur; eşikler ona göre kurulur.
  const ring = [];
  for (let x = 0; x < width; x += 1) {
    ring.push(lum[x], lum[(height - 1) * width + x]);
  }
  for (let y = 0; y < height; y += 1) {
    ring.push(lum[y * width], lum[y * width + width - 1]);
  }
  ring.sort((a, b) => a - b);
  const core = Math.max(BLACK, ring[ring.length >> 1] + 16);
  const edge = core + SOFT;

  // Kenardan başlayan doldurma: zemine bağlı koyu alanın tamamı işaretlenir.
  const cut = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (cut[index] || lum[index] > core) return;
    cut[index] = 1;
    queue[tail] = index;
    tail += 1;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  for (let index = 0, p = 0; index < total; index += 1, p += 4) {
    if (cut[index]) {
      pixels[p + 3] = 0;
      continue;
    }
    if (lum[index] >= edge) continue;
    const x = index % width;
    const touches =
      (x > 0 && cut[index - 1]) ||
      (x < width - 1 && cut[index + 1]) ||
      (index >= width && cut[index - width]) ||
      (index < total - width && cut[index + width]);
    if (!touches) continue;
    const soft = Math.round(((lum[index] - core) / (edge - core)) * 255);
    pixels[p + 3] = Math.min(pixels[p + 3], Math.max(0, soft));
  }

  context.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Görsel işlenemedi.');
  return URL.createObjectURL(blob);
}