import removeRocketWhite from '@/components/voice/roomRocket/removeRocketWhite';
import removeRocketPanelBackground from '@/components/voice/roomRocket/removeRocketPanelBackground';

const ROOT = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/';
const ROCKET_MASK = 'M716 8 L750 55 C785 137 733 262 680 323 L743 349 L753 389 L695 469 L655 462 L669 402 L628 393 L591 422 L571 478 L526 520 L310 520 L350 432 L398 382 L362 397 L303 460 L283 452 L294 349 L351 283 L447 227 L461 155 C508 94 592 56 716 8Z';
let prepared;
async function loadTransparent(src) {
  const image = await new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Roket görseli yüklenemedi.'));
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return removeRocketWhite(canvas);
}
function splitRocket(source, rocketOnly) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!rocketOnly) ctx.drawImage(source, 0, 0);
  ctx.scale(canvas.width / 1000, canvas.height / 1000);
  if (rocketOnly) { ctx.clip(new Path2D(ROCKET_MASK)); ctx.drawImage(source, 0, 0, 1000, 1000); }
  else { ctx.globalCompositeOperation = 'destination-out'; ctx.fill(new Path2D(ROCKET_MASK)); }
  return canvas.toDataURL('image/png');
}
function blankPrintedPrize(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const colour = y => { const p = ctx.getImageData(Math.floor(w * .81), Math.floor(h * y), 1, 1).data; return `rgb(${p[0]},${p[1]},${p[2]})`; };
  const gradient = ctx.createLinearGradient(0, h * .731, 0, h * .801);
  gradient.addColorStop(0, colour(.739));
  gradient.addColorStop(1, colour(.795));
  ctx.fillStyle = gradient;
  ctx.fillRect(w * .455, h * .731, w * .34, h * .07);
  return removeRocketPanelBackground(canvas).toDataURL('image/png');
}
export default function prepareRocketCelebration() {
  if (!prepared) prepared = Promise.all([loadTransparent(ROOT + '071f540c7_IMG_0333.jpg'), loadTransparent(ROOT + 'ad8bdc4ed_IMG_0334.jpg')])
    .then(([launch, reward]) => ({ rocket: splitRocket(launch, true), base: splitRocket(launch, false), reward: blankPrintedPrize(reward) }));
  return prepared;
}