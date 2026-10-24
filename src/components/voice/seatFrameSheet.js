// Kullanıcının gönderdiği 24'lü koltuk çerçevesi sayfası (6 sütun x 4 satır).
// Her çerçeve ayrı kesilir, beyaz zemin ve iç daire şeffaf yapılır.
export const SEAT_FRAME_SHEET = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d669b46f4_IMG_0260.jpg';
export const FRAME_COUNT = 24;

const COLS = [88, 256, 425, 597, 768, 937];
const ROWS = [190, 405, 635, 855];
const BOX = 220; // kesim kutusu (sayfa pikseli, 1024 tabanında)
const HOLE = 56; // iç dairenin yarıçapı

let promise = null;

export function loadSeatFrames() {
  if (promise) return promise;
  promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const s = img.naturalWidth / 1024;
        const size = Math.round(BOX * s);
        const out = [];
        ROWS.forEach((cy) => COLS.forEach((cx) => {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, (cx - BOX / 2) * s, (cy - BOX / 2 - 8) * s, size, size, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size);
          const px = data.data;
          const c = size / 2;
          const oy = c + 8 * s;
          const hole = HOLE * s;
          for (let i = 0; i < px.length; i += 4) {
            const p = i / 4;
            const x = p % size;
            const y = (p - x) / size;
            if (Math.hypot(x - c, y - oy) < hole) { px[i + 3] = 0; continue; }
            const min = Math.min(px[i], px[i + 1], px[i + 2]);
            const spread = Math.max(px[i], px[i + 1], px[i + 2]) - min;
            if (spread < 30 && min > 225) px[i + 3] = 0;
            else if (spread < 30 && min > 195) px[i + 3] = Math.round(((225 - min) / 30) * 255);
          }
          ctx.putImageData(data, 0, 0);
          out.push(canvas.toDataURL('image/png'));
        }));
        resolve(out);
      } catch { resolve([]); }
    };
    img.onerror = () => resolve([]);
    img.src = SEAT_FRAME_SHEET;
  });
  return promise;
}