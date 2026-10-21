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

// Her palet: [ışık, orta, derin, en koyu]
const GOLD = {
  klasik: ['#8a6524', '#fff6da', '#e0b463', '#a97c2e'],
  gul: ['#8a4a3a', '#ffe6dc', '#e8a98c', '#a8654a'],
  beyaz: ['#6b7480', '#ffffff', '#cfd8e3', '#8b96a5'],
  bronz: ['#5c3a15', '#ffdfa8', '#c08b45', '#7a5220'],
  platin: ['#4c5665', '#ffffff', '#c3ccd8', '#6f7b8c'],
};

const GEM = {
  turkuaz: ['#eafeff', '#6cd4d6', '#1a7a83', '#0a3941'],
  zumrut: ['#eafff4', '#4fe0a1', '#158c5f', '#05402c'],
  yakut: ['#ffe9ea', '#ff6b74', '#b31f34', '#4d0713'],
  safir: ['#e8f1ff', '#6d9dff', '#1f4bb3', '#08194d'],
  ametist: ['#f6e9ff', '#c07dff', '#7a2fb3', '#320a4d'],
  gul: ['#ffeef2', '#ff9fb8', '#c2446b', '#4d0f24'],
  kehribar: ['#fff8e0', '#ffc94f', '#c47a10', '#4d2c02'],
  platin: ['#ffffff', '#dfe8f2', '#96a6bb', '#323b48'],
  sedef: ['#fffdf7', '#f2dfc0', '#c9a978', '#5c4630'],
  bakir: ['#ffeede', '#ff9a52', '#b8541c', '#4d1c05'],
  neon: ['#eafffb', '#3cf2d6', '#00a08a', '#003b34'],
  gece: ['#efe9ff', '#8a7bff', '#4b36b3', '#150a4d'],
};

/** 12 ayrı tasarım: taş rengi + metal + süsleme düzeni birbirini tekrar etmez. */
export const RING_DESIGNS = [
  { id: 'turkuaz', gold: GOLD.klasik, gem: GEM.turkuaz, ornament: 'beads' },
  { id: 'zumrut', gold: GOLD.klasik, gem: GEM.zumrut, ornament: 'studs' },
  { id: 'yakut', gold: GOLD.klasik, gem: GEM.yakut, ornament: 'stars' },
  { id: 'safir', gold: GOLD.beyaz, gem: GEM.safir, ornament: 'rope' },
  { id: 'ametist', gold: GOLD.gul, gem: GEM.ametist, ornament: 'beads' },
  { id: 'gul', gold: GOLD.gul, gem: GEM.gul, ornament: 'studs' },
  { id: 'kehribar', gold: GOLD.bronz, gem: GEM.kehribar, ornament: 'rope' },
  { id: 'platin', gold: GOLD.platin, gem: GEM.platin, ornament: 'stars' },
  { id: 'sedef', gold: GOLD.klasik, gem: GEM.sedef, ornament: 'studs' },
  { id: 'bakir', gold: GOLD.bronz, gem: GEM.bakir, ornament: 'beads' },
  { id: 'neon', gold: GOLD.platin, gem: GEM.neon, ornament: 'rope' },
  { id: 'gece', gold: GOLD.beyaz, gem: GEM.gece, ornament: 'stars' },
];