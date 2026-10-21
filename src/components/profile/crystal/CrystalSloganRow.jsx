import { Crown, Heart } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referansın üst satırı: solda taç + kalp ile slogan, sağda taçlı el yazısı imza. */
export default function CrystalSloganRow({ tone = 'blue', slogan = 'HER ZAMAN DAHA GÜÇLÜ', signature = 'Sen Özelsin' }) {
  const c = crystalSkin(tone);

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-[3px] pt-[2px]">
        <Crown className="h-[12px] w-[12px] shrink-0" style={{ color: '#f5cf3f' }} fill="#f5cf3f" fillOpacity={0.35} strokeWidth={2.2} />
        <Heart className="h-[10px] w-[10px] shrink-0" style={{ color: '#f5cf3f' }} fill="#f5cf3f" strokeWidth={2} />
        <span
          className="text-[7.5px] font-black uppercase leading-[1.15] tracking-[0.08em]"
          style={{ color: '#f5cf3f', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
        >
          {slogan}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <Crown className="h-[10px] w-[10px]" style={{ color: c.gold }} fill={c.gold} fillOpacity={0.4} strokeWidth={2.2} />
        <span
          className="italic leading-none"
          style={{ fontFamily: 'cursive', fontSize: 13, color: c.gold, textShadow: `0 0 12px ${c.glow}` }}
        >
          {signature}
        </span>
      </div>
    </div>
  );
}