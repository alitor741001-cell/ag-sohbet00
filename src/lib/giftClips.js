import { giftModelKind } from '@/lib/gift3d';

/**
 * Hediye gönderiminde oynayan sinematik klipler.
 * Her klip iki gerçek görüntü karesinden oluşur; sahnede birbirine yumuşak geçişle akar.
 * Katalogdaki her hediye türünün klibi vardır; 3D modele düşen hediye kalmaz.
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
  bear: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/88f1244ea_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/95360ba91_generated_image.png',
  ],
  giftbox: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/af1e5d825_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b657571c7_generated_image.png',
  ],
  chocolate: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/202c36d52_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b182d3d8a_generated_image.png',
  ],
  letter: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/afb5952ae_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b249924c3_generated_image.png',
  ],
  cake: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6d6773f69_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/bdee9e8d7_generated_image.png',
  ],
  star: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/675e2653e_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6142b853e_generated_image.png',
  ],
  trophy: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1af7de2b4_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d4c4b9da2_generated_image.png',
  ],
  jet: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6efa16be3_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c5d8d435c_generated_image.png',
  ],
  island: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/25197c9ff_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0f76374ba_generated_image.png',
  ],
  butterfly: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c263c84d6_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1c6229cc0_generated_image.png',
  ],
  watch: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/41e4bcab1_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c32e8116b_generated_image.png',
  ],
  galaxy: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/32f6cf2c4_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8518c06c9_generated_image.png',
  ],
  wand: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/57202c861_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/60eeabd1d_generated_image.png',
  ],
  panther: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f770500c6_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/38e04ad14_generated_image.png',
  ],
  dragon: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3945b1870_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8bc9b2505_generated_image.png',
  ],
  rainbow: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a54078d4f_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d4affbd13_generated_image.png',
  ],
  love: [
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8b43c5779_generated_image.png',
    'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3e1c78cfd_generated_image.png',
  ],
};

/** Aynı görüntüyü paylaşan hediye türleri (yüzük → elmas, buket → gül). */
const ALIASES = {
  ring: 'diamond',
  bouquet: 'rose',
  ingot: 'diamond',
  crown: 'castle',
};

/** Hediye kaydında gerçek video dosyası (mp4/webm) varsa adresini döner. */
export function giftVideoFor(record) {
  const url = String(record?.animation_url || '').trim();
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url) ? url : '';
}

/** Hediyenin sinematik klibini döner. Klibi olmayan hediyeler hediye kutusu klibiyle gösterilir. */
export function giftClipFor(gift) {
  const kind = giftModelKind(gift);
  const key = CLIPS[kind] ? kind : ALIASES[kind];
  return CLIPS[key] || CLIPS.giftbox;
}