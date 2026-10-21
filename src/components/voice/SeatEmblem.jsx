import React from 'react';

/** Boş koltuk figürleri: 30 koltuğa 30 ayrı simge (alev, kalp, ejderha, kaplan...). */

const L = {
  stroke: 'currentColor',
  strokeWidth: 3.6,
  fill: 'none',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
};
const F = { fill: 'currentColor', stroke: 'none' };

const starPoints = (sides, outer, inner, rot = -90, cx = 50, cy = 50) =>
  Array.from({ length: sides * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (180 / sides) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const FIGURES = [
  // 1 alev
  () => (
    <>
      <path d="M50 10C60 28 76 36 76 58C76 75 65 88 50 88C35 88 24 75 24 58C24 46 31 39 37 30C39 43 46 47 48 40C50 32 45 22 50 10Z" {...L} />
      <path d="M50 54C57 63 62 67 62 74C62 81 56 87 50 87C44 87 38 81 38 74C38 67 45 62 50 54Z" {...F} fillOpacity="0.4" />
    </>
  ),
  // 2 kalp
  () => <path d="M50 86C24 68 12 55 12 39C12 25 22 14 35 14C43 14 47 19 50 24C53 19 57 14 65 14C78 14 88 25 88 39C88 55 76 68 50 86Z" {...L} fill="currentColor" fillOpacity="0.22" />,
  // 3 çiçek
  () => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="28" rx="11" ry="17" transform={`rotate(${a} 50 50)`} {...L} />
      ))}
      <circle cx="50" cy="50" r="8" {...F} fillOpacity="0.6" />
    </>
  ),
  // 4 araba
  () => (
    <>
      <path d="M16 62H84V70C84 74 81 77 77 77H23C19 77 16 74 16 70Z" {...L} />
      <path d="M32 62L40 42H62L70 62" {...L} />
      <circle cx="30" cy="78" r="8" {...L} />
      <circle cx="70" cy="78" r="8" {...L} />
    </>
  ),
  // 5 ejderha
  () => (
    <>
      <path d="M28 86C23 62 32 42 52 34C48 25 53 17 61 18C58 26 63 27 67 25C77 21 87 30 86 42C85 52 78 57 70 61C62 65 60 74 60 86Z" {...L} />
      <circle cx="68" cy="44" r="3.5" {...F} />
      <path d="M58 72L62 66L66 72" {...L} strokeWidth="2.6" />
      <path d="M36 66L26 60M38 54L28 46" {...L} strokeWidth="2.6" />
    </>
  ),
  // 6 kaplan
  () => (
    <>
      <circle cx="50" cy="56" r="28" {...L} />
      <path d="M28 34L26 18L42 28M72 34L74 18L58 28" {...L} />
      <circle cx="40" cy="50" r="3.4" {...F} />
      <circle cx="60" cy="50" r="3.4" {...F} />
      <path d="M50 56L45 63H55ZM50 34V44M32 62L42 64M68 62L58 64" {...L} strokeWidth="3" />
    </>
  ),
  // 7 yıldız
  () => <polygon points={starPoints(5, 38, 16)} {...L} fill="currentColor" fillOpacity="0.22" />,
  // 8 taç
  () => (
    <>
      <path d="M20 76L24 32L40 48L50 22L60 48L76 32L80 76Z" {...L} fill="currentColor" fillOpacity="0.18" />
      <circle cx="24" cy="30" r="3.4" {...F} />
      <circle cx="50" cy="20" r="3.4" {...F} />
      <circle cx="76" cy="30" r="3.4" {...F} />
    </>
  ),
  // 9 kılıç
  () => (
    <>
      <path d="M50 10L58 44L54 58H46L42 44Z" {...L} />
      <path d="M30 62H70M50 62V84" {...L} />
      <circle cx="50" cy="86" r="3.4" {...F} />
    </>
  ),
  // 10 hilal
  () => (
    <>
      <path d="M58 16A36 36 0 1 0 58 84A29 29 0 1 1 58 16Z" {...L} fill="currentColor" fillOpacity="0.2" />
      <polygon points={starPoints(5, 10, 4.2, -90, 72, 32)} {...F} />
    </>
  ),
  // 11 güneş
  () => (
    <>
      <circle cx="50" cy="50" r="19" {...L} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((360 / 12) * i - 90) * (Math.PI / 180);
        return <line key={i} x1={50 + 26 * Math.cos(a)} y1={50 + 26 * Math.sin(a)} x2={50 + 38 * Math.cos(a)} y2={50 + 38 * Math.sin(a)} {...L} />;
      })}
    </>
  ),
  // 12 şimşek
  () => <path d="M58 10L28 54H46L40 90L72 44H52Z" {...L} fill="currentColor" fillOpacity="0.25" />,
  // 13 yılan
  () => (
    <>
      <path d="M30 88C16 80 16 62 32 56C48 50 66 58 66 72C66 82 57 88 47 84" {...L} />
      <circle cx="28" cy="86" r="7" {...L} fill="currentColor" fillOpacity="0.25" />
      <path d="M22 90L12 94M24 92L18 96" {...L} strokeWidth="2.4" />
      <circle cx="30" cy="83" r="1.6" {...F} />
    </>
  ),
  // 14 kartal
  () => (
    <>
      <path d="M50 70C34 70 19 59 12 38C27 43 41 50 50 62C59 50 73 43 88 38C81 59 66 70 50 70Z" {...L} fill="currentColor" fillOpacity="0.2" />
      <path d="M50 26C57 33 60 46 58 64H42C40 46 43 33 50 26Z" {...L} />
      <path d="M50 33L55 40H45Z" {...F} />
    </>
  ),
  // 15 aslan
  () => (
    <>
      <polygon points={starPoints(14, 36, 26)} {...L} />
      <circle cx="50" cy="52" r="17" {...L} />
      <circle cx="43" cy="48" r="2.6" {...F} />
      <circle cx="57" cy="48" r="2.6" {...F} />
      <path d="M50 54V60M44 62C47 66 53 66 56 62" {...L} strokeWidth="2.6" />
    </>
  ),
  // 16 kurt
  () => (
    <>
      <path d="M50 20L74 34C74 60 64 80 50 88C36 80 26 60 26 34Z" {...L} />
      <path d="M30 30L24 12L44 22M70 30L76 12L56 22" {...L} />
      <circle cx="41" cy="46" r="2.8" {...F} />
      <circle cx="59" cy="46" r="2.8" {...F} />
      <path d="M50 56L44 64H56Z" {...F} />
    </>
  ),
  // 17 at nalı
  () => (
    <>
      <path d="M26 86V56A24 24 0 0 1 74 56V86" {...L} strokeWidth="11" />
      <circle cx="26" cy="82" r="2" {...F} />
      <circle cx="74" cy="82" r="2" {...F} />
      <circle cx="30" cy="46" r="2" {...F} />
      <circle cx="70" cy="46" r="2" {...F} />
      <circle cx="50" cy="30" r="2" {...F} />
    </>
  ),
  // 18 gül
  () => (
    <>
      <path d="M50 50C50 57 43 57 43 50C43 41 54 39 58 48C63 59 51 69 41 62C28 54 33 34 50 30C68 26 80 41 75 58C70 75 51 84 36 78" {...L} strokeWidth="3.2" />
      <path d="M34 76C24 76 18 82 16 90M66 78C76 78 82 84 84 90" {...L} strokeWidth="2.8" />
    </>
  ),
  // 19 kelebek
  () => (
    <>
      <path d="M50 32C38 14 16 18 14 34C12 50 32 58 48 52" {...L} />
      <path d="M50 32C62 14 84 18 86 34C88 50 68 58 52 52" {...L} />
      <path d="M50 44C40 56 28 68 34 80C40 90 48 80 50 66" {...L} />
      <path d="M50 44C60 56 72 68 66 80C60 90 52 80 50 66" {...L} />
      <path d="M50 30V72M50 30L42 20M50 30L58 20" {...L} strokeWidth="3" />
    </>
  ),
  // 20 balık
  () => (
    <>
      <path d="M20 52C34 32 62 30 76 50C62 70 34 72 20 52Z" {...L} />
      <path d="M20 52L6 38V66Z" {...L} />
      <circle cx="64" cy="46" r="2.6" {...F} />
      <path d="M46 36C50 44 50 58 44 66" {...L} strokeWidth="2.4" />
    </>
  ),
  // 21 gitar
  () => (
    <>
      <path d="M50 44C63 44 72 55 72 68C72 82 61 90 50 90C39 90 28 82 28 68C28 55 37 44 50 44Z" {...L} />
      <circle cx="50" cy="66" r="6.5" {...L} />
      <path d="M45 10H55V44H45ZM41 8H59V18H41Z" {...L} />
      <path d="M48 20V60M52 20V60" {...L} strokeWidth="1.8" />
    </>
  ),
  // 22 mikrofon
  () => (
    <>
      <path d="M50 14A14 14 0 0 1 64 28V50A14 14 0 0 1 36 50V28A14 14 0 0 1 50 14Z" {...L} />
      <path d="M38 32H62M38 42H62M50 22V56" {...L} strokeWidth="2.4" />
      <path d="M34 54A16 16 0 0 0 66 54M50 70V84M36 88H64" {...L} />
    </>
  ),
  // 23 kurukafa
  () => (
    <>
      <path d="M50 14C31 14 21 29 21 45C21 58 28 64 34 68V80H66V68C72 64 79 58 79 45C79 29 69 14 50 14Z" {...L} />
      <circle cx="39" cy="44" r="6" {...F} />
      <circle cx="61" cy="44" r="6" {...F} />
      <path d="M50 54L45 62H55Z" {...F} />
      <path d="M42 80V88M50 80V88M58 80V88" {...L} strokeWidth="2.6" />
    </>
  ),
  // 24 göz
  () => (
    <>
      <path d="M14 52C27 33 43 25 50 25C57 25 73 33 86 52C73 71 57 79 50 79C43 79 27 71 14 52Z" {...L} />
      <circle cx="50" cy="52" r="14" {...L} />
      <circle cx="50" cy="52" r="6.5" {...F} />
      <circle cx="45" cy="47" r="1.8" fill="#0a1526" stroke="none" />
    </>
  ),
  // 25 elmas
  () => (
    <>
      <path d="M50 12L80 40L50 88L20 40Z" {...L} fill="currentColor" fillOpacity="0.16" />
      <path d="M20 40H80M50 12L36 40L50 88M50 12L64 40L50 88" {...L} strokeWidth="2.6" />
    </>
  ),
  // 26 roket
  () => (
    <>
      <path d="M50 10C62 26 67 44 62 62H38C33 44 38 26 50 10Z" {...L} />
      <circle cx="50" cy="36" r="6" {...L} />
      <path d="M38 52L24 74L38 64M62 52L76 74L62 64" {...L} />
      <path d="M44 62L50 90L56 62" {...L} fill="currentColor" fillOpacity="0.3" />
    </>
  ),
  // 27 yelkenli
  () => (
    <>
      <path d="M16 76H84L72 90H28Z" {...L} />
      <path d="M50 16V76" {...L} />
      <path d="M50 20C65 34 70 52 66 68H50Z" {...L} fill="currentColor" fillOpacity="0.18" />
      <path d="M46 38C37 48 33 58 34 68H46Z" {...L} />
    </>
  ),
  // 28 uçak
  () => (
    <path d="M50 8L58 40L88 54V62L58 58V76L68 84V90L50 84L32 90V84L42 76V58L12 62V54L42 40Z" {...L} fill="currentColor" fillOpacity="0.18" />
  ),
  // 29 zambak
  () => (
    <>
      <path d="M50 10C59 26 59 42 50 56C41 42 41 26 50 10Z" {...L} fill="currentColor" fillOpacity="0.2" />
      <path d="M50 40C35 32 21 40 19 56C33 53 44 59 50 68C56 59 67 53 81 56C79 40 65 32 50 40Z" {...L} />
      <path d="M50 64V84M36 84H64" {...L} />
    </>
  ),
  // 30 yonca
  () => (
    <>
      <circle cx="37" cy="38" r="13" {...L} fill="currentColor" fillOpacity="0.18" />
      <circle cx="63" cy="38" r="13" {...L} fill="currentColor" fillOpacity="0.18" />
      <circle cx="37" cy="62" r="13" {...L} fill="currentColor" fillOpacity="0.18" />
      <circle cx="63" cy="62" r="13" {...L} fill="currentColor" fillOpacity="0.18" />
      <path d="M50 62C50 76 56 84 68 88" {...L} />
    </>
  ),
];

export default function SeatEmblem({ index = 0, className = '' }) {
  const draw = FIGURES[Math.abs(index) % FIGURES.length];
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      {draw()}
    </svg>
  );
}