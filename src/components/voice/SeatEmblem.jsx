import React from 'react';
import { Image } from '@/components/ui/image';

/** Boş koltuk görselleri: her koltukta gerçek bir nesne/fotoğraf, 30 ayrı görsel. */
const SEAT_IMAGES = [
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/9f1f4a955_generated_image.png', // alev
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/66a3b13c8_generated_image.png', // kalp
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/de486be9d_generated_image.png', // gül
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f778e627e_generated_image.png', // araba
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d6bf5fac1_generated_image.png', // ejderha
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/eca6de0d9_generated_image.png', // kaplan
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a74c3ee54_generated_image.png', // taç
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1b9563f31_generated_image.png', // kılıç
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/10807bb50_generated_image.png', // kartal
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8db3f31ba_generated_image.png', // aslan
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/701cb3006_generated_image.png', // kurt
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/ca396e5fe_generated_image.png', // yılan
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/df490e7a2_generated_image.png', // kelebek
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/380bb8beb_generated_image.png', // gitar
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6e30e5587_generated_image.png', // mikrofon
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0dcdfde44_generated_image.png', // kurukafa
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/809300836_generated_image.png', // göz
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d4681f3c9_generated_image.png', // elmas
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e807eaafc_generated_image.png', // roket
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/22a85af8f_generated_image.png', // yelkenli
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a2367fc6b_generated_image.png', // uçak
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2e8fb8a16_generated_image.png', // at nalı
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/36d4a8baa_generated_image.png', // yonca
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f292bc874_generated_image.png', // hilal
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1a5a44125_generated_image.png', // güneş
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/7a23646f6_generated_image.png', // şimşek
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cd578a1ff_generated_image.png', // balık
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e93719a2b_generated_image.png', // lotus
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/14d5c0af9_generated_image.png', // yıldız
  'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/20e19e6a7_generated_image.png', // kupa
];

export default function SeatEmblem({ index = 0, className = '' }) {
  const src = SEAT_IMAGES[Math.abs(index) % SEAT_IMAGES.length];
  return (
    <Image
      src={src}
      alt=""
      fittingType="fill"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}