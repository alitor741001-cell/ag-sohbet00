// ELİMİNSLOT görselleri: kendi tasarımımız olan vektör logo (üzerinde ELİMİNSLOT yazar),
// oyun merkezi kapağı ve arka plan.

const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

export const ELIMIN_BACKDROP = `${MEDIA_BASE}/26de19b31_generated_image.png`;
export const ELIMIN_BACKDROP_WIDTH = 1024;
export const ELIMIN_BACKDROP_HEIGHT = 1024;

// Rozetin içindeki meyve ve altın jetonlar: her iki logoda da aynı çizim kullanılır.
const FRUIT_ART = `
  <path d="M186 150 q30 -34 64 -10 q-28 32 -64 10z" fill="#3fc768"/>
  <circle cx="176" cy="216" r="48" fill="#ff4d5e"/>
  <circle cx="156" cy="196" r="15" fill="#ffb3bb" opacity="0.85"/>
  <path d="M252 258 q50 -12 64 -50 q12 46 -28 70 q-26 16 -36 -20z" fill="#ffd84d" stroke="#e6a800" stroke-width="6"/>
  <path d="M376 132 q24 -28 50 -8 q-24 26 -50 8z" fill="#3fc768"/>
  <circle cx="352" cy="228" r="21" fill="#a86bff"/>
  <circle cx="390" cy="228" r="21" fill="#a86bff"/>
  <circle cx="371" cy="192" r="21" fill="#c39cff"/>
  <circle cx="409" cy="192" r="21" fill="#a86bff"/>
  <circle cx="371" cy="264" r="21" fill="#8f4dff"/>
  <circle cx="409" cy="264" r="21" fill="#a86bff"/>
  <circle cx="118" cy="356" r="32" fill="url(#elGold)" stroke="#a9630a" stroke-width="6"/>
  <circle cx="394" cy="356" r="32" fill="url(#elGold)" stroke="#a9630a" stroke-width="6"/>
  <path d="M256 322 l11 32 h34 l-27 22 10 33 -28 -20 -28 20 10 -33 -27 -22h34z" fill="url(#elGold)" stroke="#a9630a" stroke-width="5"/>`;

const DEFS = `
  <defs>
    <linearGradient id="elBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9be7ff"/>
      <stop offset="0.52" stop-color="#a99cff"/>
      <stop offset="1" stop-color="#6b39c9"/>
    </linearGradient>
    <linearGradient id="elGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbe2"/>
      <stop offset="0.4" stop-color="#ffd75c"/>
      <stop offset="1" stop-color="#d9830c"/>
    </linearGradient>
  </defs>`;

const PLAQUE = `
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#elBg)"/>
  <rect x="38" y="38" width="436" height="436" rx="92" fill="none" stroke="#ffe9a3" stroke-width="8" opacity="0.8"/>`;

const WORDMARK = `
  <text x="256" y="380" text-anchor="middle" font-family="Verdana, Geneva, DejaVu Sans, sans-serif" font-size="60" font-weight="bold" letter-spacing="1" fill="url(#elGold)" stroke="#4a1200" stroke-width="9" stroke-linejoin="round" paint-order="stroke">ELİMİNSLOT</text>
  <text x="256" y="432" text-anchor="middle" font-family="Verdana, Geneva, DejaVu Sans, sans-serif" font-size="26" font-weight="bold" letter-spacing="5" fill="#ffe9a3">MEYVE SLOTU</text>`;

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${DEFS}${PLAQUE}${inner}</svg>`;

const dataUrl = (markup) => `data:image/svg+xml,${encodeURIComponent(markup.replace(/\s{2,}/g, ' '))}`;

// Arma: oyun ekranında markanın yanında duran metinsiz rozet.
export const ELIMIN_EMBLEM = dataUrl(svg(`<g>${FRUIT_ART}</g>`));
export const ELIMIN_EMBLEM_SIZE = 512;

// Kapak: oyun merkezindeki kart için ELİMİNSLOT yazılı logo.
export const ELIMIN_COVER = dataUrl(svg(`<g transform="translate(0 -62) scale(0.86) translate(42 0)">${FRUIT_ART}</g>${WORDMARK}`));
export const ELIMIN_COVER_WIDTH = 512;
export const ELIMIN_COVER_HEIGHT = 512;