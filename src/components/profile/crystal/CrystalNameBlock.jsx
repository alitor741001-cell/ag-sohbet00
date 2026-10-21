import { Crown, Heart } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki isim bandı: solda "HER ZAMAN DAHA GÜÇLÜ", ortada serif isim, sağda "Sen Özelsin". */
export default function CrystalNameBlock({ name, roleLabel = '', tone = 'blue' }) {
  const c = crystalSkin(tone);

  return (
    <div className="mt-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <div className="flex items-start gap-1">
          <Crown className="mt-[1px] h-[11px] w-[11px] shrink-0" style={{ color: c.gold }} strokeWidth={2.2} />
          <span className="text-[7.5px] font-black leading-[1.2] tracking-[0.06em]" style={{ color: c.gold }}>
            HER ZAMAN<br />DAHA GÜÇLÜ
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5 px-1">
          <span aria-hidden className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1px]" style={{ background: c.wing[1], boxShadow: `0 0 8px ${c.glow}` }} />
          <p
            className="max-w-[168px] truncate font-serif text-[23px] font-black uppercase leading-none tracking-[0.04em] text-white"
            style={{ textShadow: `0 0 16px ${c.glow}, 0 1px 2px rgba(0,0,0,0.8)` }}
          >
            {name}
          </p>
          <span aria-hidden className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1px]" style={{ background: c.wing[1], boxShadow: `0 0 8px ${c.glow}` }} />
        </div>

        <div className="flex flex-col items-end gap-[1px]">
          <div className="flex items-center gap-1">
            <Crown className="h-[11px] w-[11px]" style={{ color: c.gold }} strokeWidth={2.2} />
            <span className="italic" style={{ fontFamily: 'cursive', fontSize: 12, color: '#ffffff', textShadow: `0 0 10px ${c.glow}` }}>Sen Özelsin</span>
          </div>
          <Heart className="mr-1 h-[9px] w-[9px]" fill={c.heart} style={{ color: c.heart }} />
        </div>
      </div>

      {roleLabel && (
        <p className="mt-1 truncate text-center text-[9px] font-black tracking-[0.32em]" style={{ color: c.gold }}>
          {roleLabel}
        </p>
      )}
    </div>
  );
}