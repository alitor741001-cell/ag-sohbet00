import { giftModelKind } from '@/lib/gift3d';

/**
 * Hediye gönderiminde oynayan sinematik klipler.
 * Her klip iki gerçek görüntü karesinden oluşur; sahnede birbirine yumuşak geçişle akar.
 */
const CLIPS = {
  rocket: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/916db7442_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/ba314df22_generated_image.png',
  ],
  yacht: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/594c7a003_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/048d08f7b_generated_image.png',
  ],
  heart: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e1221d077_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/dfa195ae5_generated_image.png',
  ],
  rose: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8f0ca0c0e_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/15c2c002e_generated_image.png',
  ],
  diamond: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2b8d5ebda_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/aced6c5a6_generated_image.png',
  ],
  fireworks: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c0da1c73e_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c54661421_generated_image.png',
  ],
  car: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e48c5cfb7_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/11b13d7c1_generated_image.png',
  ],
  castle: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e3c745c28_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2587405ec_generated_image.png',
  ],
};

/** Aynı görüntüyü paylaşan hediye türleri (yüzük → elmas, buket → gül). */
const ALIASES = {
  ring: 'diamond',
  bouquet: 'rose',
  ingot: 'diamond',
  crown: 'castle',
};

/** Hediyenin sinematik klibini döner; klibi olmayan hediyeler 3D sahnede gösterilir. */
export function giftClipFor(gift) {
  const kind = giftModelKind(gift);
  const key = CLIPS[kind] ? kind : ALIASES[kind];
  return key ? CLIPS[key] : null;
}