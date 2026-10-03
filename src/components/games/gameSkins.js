// Oyun görselleri: motorun sembol kimlikleri ve ödemeleri aynı kalır, yalnızca görsel karşılık değişir.
// Görseller referans ekran tasarımlarındaki objelerle eşleşir; kart harfleri kod içinde çizilir.
const ART = {
  temple: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/06edfd650_generated_image.png',
  city: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/35bd2615a_generated_image.png',
  zeus: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7a6655ce7_generated_image.png',
  crown: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/948872d9d_generated_image.png',
  goblet: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a0edd0a08_generated_image.png',
  hourglass: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e9f5c09e0_generated_image.png',
  wreath: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8cac05674_generated_image.png',
  jackpot: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b413b35f6_generated_image.png',
  eagle: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8a8c2e34c_generated_image.png',
  tiger: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/680562e2b_generated_image.png',
  lion: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d23d6bc7c_generated_image.png',
  ruby: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c661e0a4c_generated_image.png',
  diamond: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a870ff013_generated_image.png',
  emerald: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/073741fc7_generated_image.png',
};

export const SKINS = {
  zeus: {
    background: ART.temple,
    symbols: {
      wild: { art: ART.crown },
      crown: { art: ART.goblet },
      bonus: { art: ART.zeus, badge: 'SCATTER' },
      gem: { art: ART.wreath, overlay: 'x2' },
      crystal: { art: ART.diamond },
      ring: { art: ART.emerald },
      star: { art: ART.ruby },
      clock: { art: ART.hourglass },
    },
  },
  jackpot: {
    background: ART.city,
    symbols: {
      wild: { art: ART.lion, badge: 'WILD' },
      crown: { art: ART.eagle },
      bonus: { art: ART.jackpot, overlay: '777', badge: 'JACKPOT' },
      gem: { art: ART.ruby },
      crystal: { art: ART.tiger },
      ring: { card: '10', tone: 'blue' },
      star: { card: 'A', tone: 'magenta' },
      clock: { card: 'K', tone: 'gold' },
    },
  },
};

export const skinFor = (name) => SKINS[name] || SKINS.zeus;

export const symbolArt = (skinName, symbolId) => skinFor(skinName).symbols?.[symbolId] || {};