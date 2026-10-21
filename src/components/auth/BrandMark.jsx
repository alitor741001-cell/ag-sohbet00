import React from 'react';
import { Image } from '@/components/ui/image';

const LOGO_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/9f24c285c_IMG_0058.jpg';

/** Şifre sıfırlama ekranlarının marka imzası: altın çerçeveli Amblem ve Ag Sohbet adı. */
export default function BrandMark() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <span
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22px]"
        style={{ boxShadow: '0 0 26px -6px rgba(255,215,0,0.55)', border: '1px solid rgba(255,215,0,0.55)' }}
      >
        <Image
          src={LOGO_URL}
          alt="Ag Sohbet"
          className="h-full w-full"
          fittingType="fill"
          quality={85}
        />
      </span>
      <span className="text-sm font-black tracking-[0.24em] text-[#f2ce6b]">AG SOHBET</span>
    </div>
  );
}