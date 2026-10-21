/**
 * Sesli odadaki profil kartının referans görseldeki kristal düzeni.
 * Erkek → referanstaki lacivert/altın, kadın → aynı düzenin pembe/altın hâli.
 */
export const GOLD_LINE = 'linear-gradient(140deg, #8a6a24 0%, #f8e9b6 20%, #d4af37 42%, #fff6d6 58%, #b8912f 78%, #f4dfa0 100%)';

const NAVY = {
  bg: 'radial-gradient(120% 58% at 50% -6%, rgba(43,94,176,0.62) 0%, rgba(13,35,72,0.74) 34%, rgba(4,13,28,0.9) 66%, #02060f 100%)',
  glass: 'linear-gradient(180deg, rgba(23,54,104,0.9) 0%, rgba(6,16,34,0.96) 100%)',
  edge: 'rgba(212,175,55,0.72)',
  edgeSoft: 'rgba(212,175,55,0.4)',
  gold: '#f4dda4',
  glow: 'rgba(96,165,250,0.5)',
  wing: ['#f0f9ff', '#7cc4f5', '#173f75'],
  heart: '#ff5b7f',
  genderFill: 'linear-gradient(180deg, #2f68b4, #0a1d39)',
};

const PINK = {
  bg: 'radial-gradient(120% 58% at 50% -6%, rgba(190,60,120,0.55) 0%, rgba(72,16,44,0.74) 34%, rgba(24,5,14,0.9) 66%, #0a0207 100%)',
  glass: 'linear-gradient(180deg, rgba(92,22,54,0.9) 0%, rgba(26,6,15,0.96) 100%)',
  edge: 'rgba(244,199,110,0.78)',
  edgeSoft: 'rgba(244,199,110,0.42)',
  gold: '#ffdca8',
  glow: 'rgba(255,110,166,0.5)',
  wing: ['#fff5fb', '#ffa9d1', '#8d1f4f'],
  heart: '#ff5b9c',
  genderFill: 'linear-gradient(180deg, #c2447f, #40102a)',
};

export function crystalSkin(tone) {
  return tone === 'blue' ? NAVY : PINK;
}