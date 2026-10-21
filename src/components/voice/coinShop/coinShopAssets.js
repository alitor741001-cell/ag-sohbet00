/** Coin mağazası görselleri — koyu lacivert (#05070A) zemin üzerinde üretilmiştir. */
export const CHEST_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cc84ba02e_generated_image.png';
/** Mağaza girişi: altın sütunlu, lacivert sinematik alışveriş holü. */
export const HERO_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7c7caa94e_generated_image.png';
export const COIN_STACK_IMAGE_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/18c2ba82a_generated_image.png';

/** Coin miktarı büyüdükçe karttaki altın yığını da büyür. */
export const stackSize = (coins) => {
  const value = Number(coins) || 0;
  if (value >= 700000) return 'h-16 w-16';
  if (value >= 400000) return 'h-14 w-14';
  if (value >= 200000) return 'h-12 w-12';
  return 'h-10 w-10';
};