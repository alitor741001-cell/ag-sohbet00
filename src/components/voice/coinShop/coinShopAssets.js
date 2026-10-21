/** Coin mağazası görselleri — koyu lacivert (#08111d) zemin üzerinde üretilmiştir. */
export const CHEST_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cc84ba02e_generated_image.png';
/** Mağaza girişi: altın sütunlu, lacivert sinematik alışveriş holü. */
export const HERO_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7c7caa94e_generated_image.png';

/**
 * Paket görselleri üç kademeye ayrılır: paket büyüdükçe hazine de büyür.
 * coinTier() paketin coin miktarına göre görsel ve kademe adını döndürür.
 */
const COIN_TIERS = [
  {
    min: 750000,
    label: 'Efsane Hazine',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2641e7b03_generated_image.png',
  },
  {
    min: 350000,
    label: 'Altın Sandık',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b03766000_generated_image.png',
  },
  {
    min: 0,
    label: 'Altın Kese',
    url: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/92e97b4ad_generated_image.png',
  },
];

export const coinTier = (coins) => {
  const value = Number(coins) || 0;
  return COIN_TIERS.find((tier) => value >= tier.min) || COIN_TIERS[COIN_TIERS.length - 1];
};

/** Coin miktarı büyüdükçe karttaki hazine görseli de büyür. */
export const stackSize = (coins) => {
  const value = Number(coins) || 0;
  if (value >= 700000) return 'h-16 w-16';
  if (value >= 400000) return 'h-14 w-14';
  if (value >= 200000) return 'h-12 w-12';
  return 'h-10 w-10';
};