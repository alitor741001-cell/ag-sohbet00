// Oyun görselleri: motorun sembol kimlikleri ve ödemeleri aynı kalır, yalnızca görsel karşılık değişir.
export const SKINS = {
  zeus: {
    symbols: {
      wild: { face: '👑' },
      crown: { face: '🏆' },
      bonus: { face: '⚡' },
      gem: { face: '💍' },
      crystal: { face: '💎' },
      ring: { face: '🌿' },
      star: { face: '⭐' },
      clock: { face: '⏳' },
    },
  },
  jackpot: {
    symbols: {
      wild: { face: '🦁', badge: 'WILD' },
      crown: { face: '🦅' },
      bonus: { face: '🎯', badge: 'FREE' },
      gem: { face: '💎' },
      crystal: { face: '🐯' },
      ring: { label: '10' },
      star: { label: 'A' },
      clock: { label: 'K' },
    },
  },
};

export const skinFor = (name) => SKINS[name] || SKINS.zeus;

export const symbolArt = (skinName, symbolId) => skinFor(skinName).symbols?.[symbolId] || {};