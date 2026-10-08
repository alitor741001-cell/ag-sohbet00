import React from 'react';

// Özgün şeker şekilleri: her sembol tek bakışta ayırt edilir (farklı siluet + renk).
// Gövde rengi SekerliSymbol'deki radyal dolgudan gelir.

const GLOSS = '#ffffff';

/** Yıldız köşeleri: dış ve iç yarıçap arasında dönüşümlü. */
const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const radius = index % 2 === 0 ? 17.4 : 7.4;
  const angle = -Math.PI / 2 + (index * Math.PI) / 5;
  return `${(20 + radius * Math.cos(angle)).toFixed(2)},${(19.5 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

export const SEKERLI_SHAPES = {
  // Pembe şeker: iki yanı bükülmüş ambalajlı bonbon.
  bonbon: ({ fill, dark, light }) => (
    <>
      <path d="M10 20 L2.5 13.2 L4.8 20 L2.5 26.8 Z" fill={dark} opacity="0.92" />
      <path d="M30 20 L37.5 13.2 L35.2 20 L37.5 26.8 Z" fill={dark} opacity="0.92" />
      <circle cx="20" cy="20" r="11.2" fill={fill} />
      <path d="M11 27 Q20 32.5 29 27" stroke={dark} strokeWidth="1.6" fill="none" opacity="0.35" />
      <path d="M12 16.4 Q20 12.4 28 16.4" stroke={light} strokeWidth="2.6" fill="none" opacity="0.6" strokeLinecap="round" />
    </>
  ),

  // Mavi şeker: üst yüzü aydınlık, altı gölgeli küp.
  cube: ({ fill, light, dark }) => (
    <>
      <rect x="7" y="8.5" width="26" height="24" rx="6.5" fill={fill} />
      <path d="M7 25.5 L33 25.5 L33 26.5 Q33 32.5 26.5 32.5 L13.5 32.5 Q7 32.5 7 26.5 Z" fill={dark} opacity="0.38" />
      <path d="M9.6 14.4 Q11.4 11 15.4 11 L24.6 11 Q28.6 11 30.4 14.4" stroke={light} strokeWidth="2.6" fill="none" opacity="0.62" strokeLinecap="round" />
    </>
  ),

  // Yeşil jelibon: alt kenarı dalgalı yumuşak jöle.
  jelly: ({ fill, light, dark }) => (
    <>
      <path d="M20 6.5 C28.8 6.5 34.6 12 34.6 18.8 C34.6 25.6 28.8 31.4 20 31.4 C11.2 31.4 5.4 25.6 5.4 18.8 C5.4 12 11.2 6.5 20 6.5 Z" fill={fill} />
      <path d="M8.6 25 Q14 30.6 20 30.6 Q26 30.6 31.4 25 Q27 33.6 20 33.6 Q13 33.6 8.6 25 Z" fill={dark} opacity="0.35" />
      <path d="M12.4 15 Q17 11.4 23 12" stroke={light} strokeWidth="2.4" fill="none" opacity="0.6" strokeLinecap="round" />
    </>
  ),

  // Sarı şeker: yuvarlatılmış eşkenar dörtgen, ortasında akış çizgisi.
  lozenge: ({ fill, light }) => (
    <>
      <path d="M20 5 L35 20 L20 35 L5 20 Z" fill={fill} stroke={fill} strokeWidth="6.5" strokeLinejoin="round" />
      <path d="M20 12 Q26 20 20 28 Q14 20 20 12 Z" fill={light} opacity="0.55" />
      <path d="M9 17.6 Q14 12.6 21 11.8" stroke={GLOSS} strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round" />
    </>
  ),

  // Kırmızı kalp şeker: dolgun kalp gövdesi + iç gölge.
  heart: ({ fill, light, dark }) => (
    <>
      <path d="M20 33.5 C8.4 24.8 4.4 19 4.4 14.4 C4.4 9.4 8.3 5.6 13 5.6 C16.4 5.6 18.9 7.5 20 9.9 C21.1 7.5 23.6 5.6 27 5.6 C31.7 5.6 35.6 9.4 35.6 14.4 C35.6 19 31.6 24.8 20 33.5 Z" fill={fill} />
      <path d="M20 30 C11.2 23.2 7.4 18.6 7.4 14.9 C7.4 12 9.4 9.6 12.2 9.6 C15.8 9.6 18.6 13.6 20 17.6 C21.4 13.6 24.2 9.6 27.8 9.6 C30.6 9.6 32.6 12 32.6 14.9 C32.6 18.6 28.8 23.2 20 30 Z" fill={dark} opacity="0.24" />
      <ellipse cx="13.4" cy="12.8" rx="3.9" ry="2.5" fill={light} opacity="0.75" transform="rotate(-28 13.4 12.8)" />
    </>
  ),

  // Bonus şeker: sarmal desenli lolipop ve beyaz çubuğu.
  lolli: ({ fill, light, dark }) => (
    <>
      <rect x="18.3" y="19" width="3.4" height="17.5" rx="1.7" fill={light} />
      <circle cx="20" cy="16.8" r="12.6" fill={fill} />
      <path d="M20 17 m0 -8.6 a8.6 8.6 0 0 1 8.6 8.6 a6.2 6.2 0 0 1 -6.2 6.2 a4.1 4.1 0 0 1 -4.1 -4.1 a2.4 2.4 0 0 1 2.4 -2.4" fill="none" stroke={light} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <circle cx="20" cy="16.8" r="12.6" fill="none" stroke={dark} strokeWidth="1.4" opacity="0.45" />
    </>
  ),

  // Gökkuşağı şeker (joker): ambalajlı gövdeli çok renkli halkalar.
  rainbow: ({ fill, dark }) => (
    <>
      <path d="M9.6 20 L2.4 12.6 L4.8 20 L2.4 27.4 Z" fill={dark} opacity="0.95" />
      <path d="M30.4 20 L37.6 12.6 L35.2 20 L37.6 27.4 Z" fill={dark} opacity="0.95" />
      <circle cx="20" cy="20" r="11.4" fill={fill} />
      <circle cx="20" cy="20" r="11.4" fill="none" stroke="#ff3b8d" strokeWidth="2.6" />
      <circle cx="20" cy="20" r="8.6" fill="none" stroke="#ffd21f" strokeWidth="2.6" />
      <circle cx="20" cy="20" r="5.8" fill="none" stroke="#2fd24f" strokeWidth="2.6" />
      <circle cx="20" cy="20" r="3" fill="#2f8bff" />
    </>
  ),

  // Yıldız bonus (scatter): altın yıldız.
  star: ({ fill, light }) => (
    <>
      <polygon points={STAR_POINTS} fill={fill} stroke={light} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="20" cy="17.6" r="4" fill={GLOSS} opacity="0.5" />
    </>
  ),
};