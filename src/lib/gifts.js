/** Sesli odada gönderilebilen hediyeler — hediye paneli, sohbet satırı ve uçan hediye görseli bu listeyi kullanır. */
export const GIFTS = [
  { id: 'rose', name: 'Gül', emoji: '🌹', coins: 1 },
  { id: 'heart', name: 'Kalp', emoji: '❤️', coins: 10 },
  { id: 'bear', name: 'Ayıcık', emoji: '🧸', coins: 20 },
  { id: 'ring', name: 'Yüzük', emoji: '💍', coins: 50 },
  { id: 'gem', name: 'Elmas', emoji: '💎', coins: 100 },
  { id: 'car', name: 'Spor Araba', emoji: '🏎️', coins: 500 },
  { id: 'castle', name: 'Şato', emoji: '🏰', coins: 1000 },
  { id: 'crown', name: 'Taç', emoji: '👑', coins: 2000 },
];

const GIFT_MAP = GIFTS.reduce((map, gift) => ({ ...map, [gift.id]: gift }), {});

export const giftById = (id) => (id && GIFT_MAP[id]) || null;