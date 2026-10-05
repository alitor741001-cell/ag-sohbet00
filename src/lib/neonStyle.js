// Karanlık neon panel dili: siyah zemin (#000000), ince parlayan çerçeve.
// Renkler doğrudan tasarım referansından alınır:
// altın #FFD700 · kırmızı #FF0033 · mavi #007BFF · mor #8A2BE2 · yeşil #00FF66.
// Sınıf adları düz metin olarak yazılır — Tailwind yalnızca kaynakta gördüğü sınıfları üretir.
export const NEON_TONES = {
  gold: {
    text: 'text-[#FFD700]',
    label: 'text-[#FFD700]',
    card: 'border-[#FFD700]/45 shadow-[0_0_18px_-8px_rgba(255,215,0,0.9)]',
    circle: 'border-[#FFD700]/55 shadow-[0_0_14px_-4px_rgba(255,215,0,0.95)]',
  },
  red: {
    text: 'text-[#FF5A7A]',
    label: 'text-[#FF8AA0]',
    card: 'border-[#FF0033]/55 shadow-[0_0_18px_-8px_rgba(255,0,51,0.9)]',
    circle: 'border-[#FF0033]/60 shadow-[0_0_14px_-4px_rgba(255,0,51,0.95)]',
  },
  blue: {
    text: 'text-[#4DA3FF]',
    label: 'text-[#7FBEFF]',
    card: 'border-[#007BFF]/55 shadow-[0_0_18px_-8px_rgba(0,123,255,0.9)]',
    circle: 'border-[#007BFF]/60 shadow-[0_0_14px_-4px_rgba(0,123,255,0.95)]',
  },
  purple: {
    text: 'text-[#B06BFF]',
    label: 'text-[#C99BFF]',
    card: 'border-[#8A2BE2]/55 shadow-[0_0_18px_-8px_rgba(138,43,226,0.9)]',
    circle: 'border-[#8A2BE2]/60 shadow-[0_0_14px_-4px_rgba(138,43,226,0.95)]',
  },
  green: {
    text: 'text-[#00FF66]',
    label: 'text-[#7CFFAE]',
    card: 'border-[#00FF66]/50 shadow-[0_0_18px_-8px_rgba(0,255,102,0.9)]',
    circle: 'border-[#00FF66]/55 shadow-[0_0_14px_-4px_rgba(0,255,102,0.95)]',
  },
  white: {
    text: 'text-white',
    label: 'text-white/75',
    card: 'border-white/25 shadow-[0_0_16px_-8px_rgba(255,255,255,0.8)]',
    circle: 'border-white/30 shadow-[0_0_12px_-4px_rgba(255,255,255,0.8)]',
  },
};

/** Siyah zeminli parlayan kart. */
export const neonCardClass = (tone = 'gold') => `rounded-2xl border bg-black/70 ${NEON_TONES[tone].card}`;

/** Siyah zeminli parlayan daire (ikon düğmesi). */
export const neonCircleClass = (tone = 'gold') => `flex items-center justify-center rounded-full border bg-black/70 ${NEON_TONES[tone].circle}`;

/** Tonun metin rengi. */
export const neonTextClass = (tone = 'gold') => NEON_TONES[tone].text;