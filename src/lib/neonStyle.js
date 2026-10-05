// Karanlık neon panel dili: siyah zemin, ince parlayan çerçeve.
// Sınıf adları düz metin olarak yazılır — Tailwind yalnızca kaynakta gördüğü sınıfları üretir.
export const NEON_TONES = {
  gold: {
    text: 'text-[#F2CE6B]',
    label: 'text-[#F2CE6B]',
    card: 'border-[#F2CE6B]/45 shadow-[0_0_18px_-8px_rgba(242,206,107,0.9)]',
    circle: 'border-[#F2CE6B]/55 shadow-[0_0_14px_-4px_rgba(242,206,107,0.95)]',
  },
  red: {
    text: 'text-[#FF5A5A]',
    label: 'text-[#FF8A8A]',
    card: 'border-[#FF5A5A]/45 shadow-[0_0_18px_-8px_rgba(255,90,90,0.9)]',
    circle: 'border-[#FF5A5A]/55 shadow-[0_0_14px_-4px_rgba(255,90,90,0.95)]',
  },
  blue: {
    text: 'text-[#4FC3F7]',
    label: 'text-[#8FD9FF]',
    card: 'border-[#4FC3F7]/45 shadow-[0_0_18px_-8px_rgba(79,195,247,0.9)]',
    circle: 'border-[#4FC3F7]/55 shadow-[0_0_14px_-4px_rgba(79,195,247,0.95)]',
  },
  purple: {
    text: 'text-[#C88BFF]',
    label: 'text-[#D5AAFF]',
    card: 'border-[#A855F7]/45 shadow-[0_0_18px_-8px_rgba(168,85,247,0.9)]',
    circle: 'border-[#A855F7]/55 shadow-[0_0_14px_-4px_rgba(168,85,247,0.95)]',
  },
  green: {
    text: 'text-[#4ADE80]',
    label: 'text-[#87EFA8]',
    card: 'border-[#4ADE80]/45 shadow-[0_0_18px_-8px_rgba(74,222,128,0.9)]',
    circle: 'border-[#4ADE80]/55 shadow-[0_0_14px_-4px_rgba(74,222,128,0.95)]',
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