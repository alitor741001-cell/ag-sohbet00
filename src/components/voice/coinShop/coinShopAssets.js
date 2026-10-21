/** Coin mağazası görselleri — koyu lacivert zemin üzerinde üretilmiştir. */
export const CHEST_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cc84ba02e_generated_image.png';
/** Mağaza girişi: altın sütunlu, lacivert sinematik alışveriş holü. */
export const HERO_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7c7caa94e_generated_image.png';

/**
 * Paket görselleri üç kademeye ayrılır: paket büyüdükçe hazine de büyür.
 * Görseller geniş çekimdir; kartın görsel alanını kenarları eriyerek kaplar.
 */
const COIN_TIERS = [
  {
    min: 750000,
    label: 'Efsane Hazine',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/848ad7156_generated_image.png',
  },
  {
    min: 350000,
    label: 'Altın Sandık',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6c6d52bda_generated_image.png',
  },
  {
    min: 0,
    label: 'Altın Kese',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0267a77f3_generated_image.png',
  },
];

export const coinTier = (coins) => {
  const value = Number(coins) || 0;
  return COIN_TIERS.find((tier) => value >= tier.min) || COIN_TIERS[COIN_TIERS.length - 1];
};