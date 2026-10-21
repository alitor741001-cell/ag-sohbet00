/**
 * Sesli odadaki profil kartının referans görseldeki kristal düzeni.
 * Erkek → referanstaki lacivert/altın, kadın → aynı düzenin pembe/altın hâli.
 */
export const GOLD_LINE = 'linear-gradient(140deg, #8a6a24 0%, #f8e9b6 20%, #d4af37 42%, #fff6d6 58%, #b8912f 78%, #f4dfa0 100%)';

const NAVY = {
  bg: 'radial-gradient(72% 46% at 16% 4%, rgba(0,140,225,0.44) 0%, rgba(0,60,130,0) 62%), radial-gradient(64% 42% at 86% 12%, rgba(0,100,195,0.38) 0%, rgba(0,40,100,0) 64%), radial-gradient(120% 72% at 50% 104%, rgba(0,58,120,0.5) 0%, rgba(0,10,26,0) 72%), linear-gradient(180deg, #000b1a 0%, #001226 52%, #00060f 100%)',
  glass: 'linear-gradient(180deg, rgba(22,58,110,0.92) 0%, rgba(4,14,32,0.97) 100%)',
  edge: 'rgba(212,175,55,0.8)',
  edgeSoft: 'rgba(212,175,55,0.42)',
  gold: '#f4dda4',
  glow: 'rgba(56,160,255,0.55)',
  blue: '#59b6ff',
  blueEdge: 'rgba(90,178,255,0.88)',
  wing: ['#eef9ff', '#79c3f7', '#10305e'],
  heart: '#ff5b7f',
  genderFill: 'linear-gradient(180deg, #2f68b4, #0a1d39)',
};

const PINK = {
  bg: 'radial-gradient(72% 46% at 16% 4%, rgba(215,60,135,0.44) 0%, rgba(90,10,45,0) 62%), radial-gradient(64% 42% at 86% 12%, rgba(190,45,120,0.36) 0%, rgba(70,6,34,0) 64%), radial-gradient(120% 72% at 50% 104%, rgba(120,20,60,0.5) 0%, rgba(22,3,12,0) 72%), linear-gradient(180deg, #12030b 0%, #1d0512 52%, #080105 100%)',
  glass: 'linear-gradient(180deg, rgba(96,22,56,0.92) 0%, rgba(26,5,16,0.97) 100%)',
  edge: 'rgba(244,199,110,0.82)',
  edgeSoft: 'rgba(244,199,110,0.44)',
  gold: '#ffdca8',
  glow: 'rgba(255,110,166,0.55)',
  blue: '#ff9ecb',
  blueEdge: 'rgba(255,140,190,0.9)',
  wing: ['#fff5fb', '#ffa9d1', '#7a1642'],
  heart: '#ff5b9c',
  genderFill: 'linear-gradient(180deg, #c2447f, #40102a)',
};

export function crystalSkin(tone) {
  return tone === 'blue' ? NAVY : PINK;
}