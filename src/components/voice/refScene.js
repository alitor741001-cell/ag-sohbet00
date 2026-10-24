export const REF_SCENE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/5a74aba72_IMG_0179.jpg';
const W = 494;
const H = 1024;

// Görsel üzerindeki bir alanın merkezini ve boyutunu (görsel pikseli) yüzdelik konuma çevirir.
export function spot(cx, cy, w, h = w) {
  return {
    position: 'absolute',
    left: `${((cx - w / 2) / W) * 100}%`,
    top: `${((cy - h / 2) / H) * 100}%`,
    width: `${(w / W) * 100}%`,
    height: `${(h / H) * 100}%`,
  };
}

export const SEAT_COLS = [48, 130, 208, 286, 363, 442];
export const SEAT_ROWS = [222, 327, 438, 546];