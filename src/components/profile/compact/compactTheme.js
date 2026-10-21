/**
 * Kompakt profil kartının referans görseldeki renk düzeni.
 * Kadın → pembe kristal, Erkek → mavi kristal tonları.
 */
const PINK = {
  crystal: 'linear-gradient(158deg, #fff6fb 0%, #ffc2de 24%, #e85897 56%, #ffe3f0 80%, #ff92c2 100%)',
  crystalGlow: '0 0 22px -4px rgba(255,110,166,0.9), inset 0 0 10px -4px rgba(255,231,242,0.95)',
  light: '#ffd9ea',
  mid: '#f07fb3',
  deep: '#b32b68',
  edge: 'rgba(255,150,195,0.68)',
  soft: 'rgba(255,110,166,0.3)',
  banner: 'linear-gradient(180deg, #ffe9f4 0%, #ffcbe2 46%, #f3a6ca 100%)',
  bannerTop: '#fff6fb',
  bannerBorder: 'rgba(255,168,205,0.95)',
  heart: '#ff5b9c',
  caption: '#a81f5d',
  captionGlow: 'rgba(255,110,166,0.9)',
  boardTop: 'rgba(116,26,68,0.92)',
  boardBottom: 'rgba(44,9,26,0.95)',
  boardEdge: 'rgba(255,150,195,0.62)',
  slot: 'rgba(255,158,198,0.85)',
  label: '#ffcde3',
  tileFill: 'linear-gradient(180deg, rgba(48,10,28,0.94), rgba(14,3,9,0.98))',
  genderBg: 'linear-gradient(160deg, #ffb0d2 0%, #f4629b 100%)',
  genderBorder: '#ffd6e8',
};

const BLUE = {
  crystal: 'linear-gradient(158deg, #f2fbff 0%, #a8d8f5 26%, #3576b8 58%, #d9f2ff 82%, #6aa9e0 100%)',
  crystalGlow: '0 0 22px -4px rgba(96,176,240,0.9), inset 0 0 10px -4px rgba(190,235,255,0.95)',
  light: '#d9f2ff',
  mid: '#6aa9e0',
  deep: '#1f4f80',
  edge: 'rgba(127,182,221,0.62)',
  soft: 'rgba(88,166,232,0.3)',
  banner: 'linear-gradient(180deg, #e8f5ff 0%, #bfe0fa 46%, #94c6ec 100%)',
  bannerTop: '#f4fbff',
  bannerBorder: 'rgba(150,200,238,0.95)',
  heart: '#3ea8ff',
  caption: '#0f4a7d',
  captionGlow: 'rgba(96,176,240,0.9)',
  boardTop: 'rgba(13,43,69,0.92)',
  boardBottom: 'rgba(5,16,28,0.95)',
  boardEdge: 'rgba(127,182,221,0.58)',
  slot: 'rgba(168,216,245,0.85)',
  label: '#a9d3ee',
  tileFill: 'linear-gradient(180deg, rgba(10,32,50,0.94), rgba(3,9,16,0.98))',
  genderBg: 'linear-gradient(160deg, #a8dcff 0%, #3d84d8 100%)',
  genderBorder: '#cfeaff',
};

/** Altın her iki temada da aynı kalır (kalp kanatları, çerçeve halkası). */
export const GOLD = '#d4af37';

export function compactTone(tone) {
  return tone === 'blue' ? BLUE : PINK;
}