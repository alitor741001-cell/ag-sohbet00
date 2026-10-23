// Referans tasarım görselinden (494x1024 birim) parça keser: koltuk çerçeveleri, üst bar ve alt bar.
export const DESIGN_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/276d58833_IMG_0179.jpg';
const W = 494;
const H = 1024;

export default function DesignSprite({ x, y, w, h, className = '', style, children }) {
  return (
    <div
      className={`relative bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url("${DESIGN_URL}")`,
        backgroundSize: `${(W / w) * 100}% auto`,
        backgroundPosition: `${(x / (W - w)) * 100}% ${(y / (H - h)) * 100}%`,
        aspectRatio: `${w} / ${h}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const COLS = [48, 130, 208, 286, 364, 442];
const ROWS = [217, 327, 437, 546];

/** Koltuk numarasına göre tasarımdaki çerçeve kesiti (24 çerçeve döngüsel). */
export function seatFrameBox(index) {
  const i = Math.abs(index) % 24;
  const cx = COLS[i % 6];
  const cy = ROWS[Math.floor(i / 6)];
  return { x: cx - 41, y: cy - 50, w: 82, h: 82 };
}