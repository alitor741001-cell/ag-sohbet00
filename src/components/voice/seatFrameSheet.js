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
          // Beyaz zemin dış kenarlardan ve iç daireden taşan dolgu ile silinir:
          // çerçevenin içindeki parlak detaylar (tel, taş parıltısı) korunur.
          const n = size * size;
          const bg = (p) => {
            const i = p * 4;
            const min = Math.min(px[i], px[i + 1], px[i + 2]);
            return min > 200 && Math.max(px[i], px[i + 1], px[i + 2]) - min < 40;
          };
          const cleared = new Uint8Array(n);
          const stack = [];
          for (let x = 0; x < size; x += 1) stack.push(x, (size - 1) * size + x);
          for (let y = 0; y < size; y += 1) stack.push(y * size, y * size + size - 1);
          for (let p = 0; p < n; p += 1) {
            const x = p % size; const y = (p - x) / size;
            if (Math.hypot(x - c, y - oy) < hole) { cleared[p] = 1; px[p * 4 + 3] = 0; stack.push(p); }
          }
          const seen = new Uint8Array(n);
          while (stack.length) {
            const p = stack.pop();
            if (seen[p]) continue;
            seen[p] = 1;
            if (!cleared[p] && !bg(p)) continue;
            cleared[p] = 1; px[p * 4 + 3] = 0;
            const x = p % size;
            if (x > 0) stack.push(p - 1);
            if (x < size - 1) stack.push(p + 1);
            if (p >= size) stack.push(p - size);
            if (p < n - size) stack.push(p + size);
          }
          // Kenar yumuşatma: silinen alana komşu açık pikseller kısmen şeffaflaşır (beyaz hale kalmaz).
          for (let p = 0; p < n; p += 1) {
            if (cleared[p]) continue;
            const x = p % size;
            const near = (x > 0 && cleared[p - 1]) || (x < size - 1 && cleared[p + 1]) || (p >= size && cleared[p - size]) || (p < n - size && cleared[p + size]);
            if (!near) continue;
            const i = p * 4;
            const min = Math.min(px[i], px[i + 1], px[i + 2]);
            if (min > 150) px[i + 3] = Math.round(Math.max(0, (215 - min) / 65) * 255);
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