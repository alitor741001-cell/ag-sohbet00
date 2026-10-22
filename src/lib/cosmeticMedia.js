import { base44 } from '@/api/base44Client';
import { frameDesignFor } from '@/lib/frameCollection';
import { drawAlignedFrame, FRAME_APERTURE_RADIUS } from '@/lib/frameGeometry';
const signed = new Map();
const artworks = new Map();
export async function cosmeticMediaUrl(source) {
  if (!source || /^https:\/\/(?!media\.base44\.com\/.*private)/.test(source)) return source;
  const old = signed.get(source);
  if (old?.until > Date.now()) return old.url;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: source, expires_in: 3600 });
  signed.set(source, { url: signed_url, until: Date.now() + 3300000 });
  return signed_url;
}
export function cosmeticArtwork(product) {
  const key = JSON.stringify([product.image_url, product.crop, product.remove_white]);
  if (artworks.has(key)) return artworks.get(key);
  const task = (async () => {
    const source = await cosmeticMediaUrl(product.image_url);
    if (!product.crop?.w && !product.remove_white) return source;
    const image = new window.Image(); image.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Görsel yüklenemedi.')); image.src = source; });
    const r = product.crop?.w ? product.crop : { x: 0, y: 0, w: 1, h: 1 };
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 480;
    const ctx = canvas.getContext('2d', { willReadFrequently: !!product.remove_white });
    const collectionFrame = frameDesignFor(product.image_url);
    if (collectionFrame) drawAlignedFrame(ctx, image, collectionFrame);
    else ctx.drawImage(image, r.x * image.width, r.y * image.height, r.w * image.width, r.h * image.height, 0, 0, 480, 480);
    if (product.remove_white) {
      const pixels = ctx.getImageData(0, 0, 480, 480);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const min = Math.min(pixels.data[i], pixels.data[i+1], pixels.data[i+2]);
        const threshold = collectionFrame ? 220 : 240;
        if (min > threshold) pixels.data[i+3] = Math.round(pixels.data[i+3] * (255 - min) / (255 - threshold));
      }
      ctx.putImageData(pixels, 0, 0);
    }
    if (collectionFrame) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(240, 240, FRAME_APERTURE_RADIUS, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    return canvas.toDataURL('image/png');
  })();
  artworks.set(key, task);
  task.catch(() => artworks.delete(key));
  return task;
}