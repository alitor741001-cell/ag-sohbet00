/** Koltuk çemberi tasarım paletleri ve yardımcı geometri. */

export const CX = 100;

export const polar = (r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CX + r * Math.sin(rad)];
};

/** Çember üzerinde eşit aralıklı noktalar üretir. */
export const ringPoints = (count, r, offset = 0) =>
  Array.from({ length: count }, (_, i) => {
    const deg = (360 / count) * i + offset;
    const [x, y] = polar(r, deg);
    return { deg, x, y };
  });

/** Köşeli gövde yolu: kenar sayısı ve yarıçap. */
export const polygonPath = (sides, r, rotation = 0) => {
  const points = Array.from({ length: sides }, (_, i) => polar(r, rotation + (360 / sides) * i));
  return `${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')} Z`;
};

/** Dişli / tırtıklı gövde yolu: iç ve dış yarıçap dönüşümlü. */
export const gearPath = (teeth, outer, inner, rotation = 0) => {
  const points = Array.from({ length: teeth * 2 }, (_, i) =>
    polar(i % 2 === 0 ? outer : inner, rotation + (180 / teeth) * i));
  return `${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')} Z`;
};

// Metaller: [gölge, parlak, ana ton, kenar]
const METALS = {
  altin: ['hsl(38 60% 31%)', 'hsl(46 100% 93%)', 'hsl(42 78% 63%)', 'hsl(38 62% 42%)'],
  gul: ['hsl(14 55% 38%)', 'hsl(18 100% 93%)', 'hsl(16 78% 72%)', 'hsl(14 55% 50%)'],
  beyaz: ['hsl(210 12% 40%)', 'hsl(0 0% 100%)', 'hsl(210 20% 85%)', 'hsl(212 14% 58%)'],
  bronz: ['hsl(28 65% 23%)', 'hsl(36 100% 86%)', 'hsl(30 62% 50%)', 'hsl(26 58% 33%)'],
  platin: ['hsl(218 16% 30%)', 'hsl(0 0% 100%)', 'hsl(216 18% 81%)', 'hsl(218 12% 47%)'],
  bakir: ['hsl(18 62% 29%)', 'hsl(24 100% 87%)', 'hsl(20 72% 53%)', 'hsl(16 60% 37%)'],
  sampanya: ['hsl(42 42% 38%)', 'hsl(48 100% 95%)', 'hsl(44 62% 75%)', 'hsl(42 40% 53%)'],
  gumus: ['hsl(200 10% 36%)', 'hsl(0 0% 100%)', 'hsl(200 12% 87%)', 'hsl(202 8% 61%)'],
};

/** Taş paleti: açık parlaklıktan derin gölgeye dört kademe. */
const gemPalette = (hue) => [
  `hsl(${hue} 100% 96%)`,
  `hsl(${hue} 92% 70%)`,
  `hsl(${hue} 80% 42%)`,
  `hsl(${hue} 76% 19%)`,
];

/** 30 koltuk, 30 ayrı taş tonu. */
const HUES = [
  174, 150, 352, 220, 276, 336, 44, 200, 34, 22,
  168, 258, 96, 186, 208, 246, 300, 320, 0, 12,
  26, 40, 56, 84, 120, 158, 178, 232, 268, 312,
];

// Gövde siluetleri: yuvarlak, sekizgen, on iki kenar, altıgen, tırtık, dişli.
const SHAPES = ['circle', 'octa', 'dodeca', 'hex', 'scallop', 'gear'];
const ORNAMENTS = ['beads', 'studs', 'stars', 'rope'];
const STONES = ['round', 'square', 'marquise', 'star'];
const METAL_ORDER = ['altin', 'beyaz', 'gul', 'bronz', 'platin', 'bakir', 'sampanya', 'gumus'];

/**
 * 30 tasarım: silüet her koltuğa dönüşümlü, süsleme altı koltukta bir,
 * taş kesimi ve metal ise hiçbir ikili tekrar etmeyecek şekilde kaydırılır.
 */
export const RING_DESIGNS = HUES.map((hue, i) => {
  const lap = Math.floor(i / SHAPES.length);
  const turn = Math.floor(i / 24);
  const shape = SHAPES[i % SHAPES.length];
  return {
    id: `seat-${i + 1}`,
    gold: METALS[METAL_ORDER[(i + turn) % METAL_ORDER.length]],
    gem: gemPalette(hue),
    shape,
    ornament: ORNAMENTS[lap % ORNAMENTS.length],
    stone: STONES[(i + turn) % STONES.length],
    leaves: shape !== 'gear' && shape !== 'scallop',
  };
});