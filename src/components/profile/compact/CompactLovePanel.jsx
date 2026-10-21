import { useId } from 'react';
import { Image } from '@/components/ui/image';
import { GOLD, compactTone } from '@/components/profile/compact/compactTheme';

/**
 * Referanstaki aşk şeridi: dalgalı üst kenar ve gül köşeleri olan pastel panel.
 * Solda küçük kristal fotoğraf, ortada altın kanatlı kalp ve "Aşk için bekliyor",
 * sağda ikinci kişi için boş altın halka.
 */
export default function CompactLovePanel({ avatar, name, onGift, tone = 'pink' }) {
  const c = compactTone(tone);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className="relative mt-2 overflow-hidden rounded-[14px] border"
      style={{
        borderColor: c.bannerBorder,
        background: c.banner,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 0 20px -14px rgba(0,0,0,0.9)',
      }}
    >
      {/* Dalgalı üst kenar. */}
      <svg aria-hidden viewBox="0 0 200 10" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[7px] w-full">
        <path
          d="M0 9 Q 12.5 -1 25 9 T 50 9 T 75 9 T 100 9 T 125 9 T 150 9 T 175 9 T 200 9 V 0 H 0 Z"
          fill={c.bannerTop}
          opacity="0.9"
        />
      </svg>
      <span aria-hidden className="pointer-events-none absolute left-[1px] top-[1px] rotate-[-8deg] text-[11px] leading-none opacity-90">🌹</span>
      <span aria-hidden className="pointer-events-none absolute right-[1px] top-[1px] rotate-[8deg] text-[11px] leading-none opacity-90">🌹</span>

      <div className="relative flex items-center justify-between gap-1.5 px-2 pb-2 pt-3">
        <span
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full p-[2px]"
          style={{ background: c.crystal, boxShadow: `0 0 14px -4px ${c.mid}` }}
        >
          <span className="h-full w-full overflow-hidden rounded-full bg-[#0b1220] ring-[1.5px] ring-white/70">
            {avatar
              ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full" referrerPolicy="no-referrer" />
              : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">{(name || '?')[0]}</span>}
          </span>
        </span>

        <button
          type="button"
          onClick={onGift}
          disabled={!onGift}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 active:scale-95 disabled:opacity-90"
        >
          <svg aria-hidden viewBox="-2 2 44 34" className="h-[30px] w-[38px]">
            <defs>
              <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff0bf" />
                <stop offset="45%" stopColor={GOLD} />
                <stop offset="100%" stopColor="#f6e2a4" />
              </linearGradient>
              <linearGradient id={`heart-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor={c.heart} />
                <stop offset="100%" stopColor={c.heart} />
              </linearGradient>
            </defs>
            <g fill={`url(#gold-${uid})`} stroke="#8a6b16" strokeWidth="0.5">
              <path d="M14 12 C8 6,2 7,-1 12 C4 12,8 15,10 19 C6 18,2 19,-1 21 C5 23,10 22,14 19 Z" />
              <path d="M26 12 C32 6,38 7,41 12 C36 12,32 15,30 19 C34 18,38 19,41 21 C35 23,30 22,26 19 Z" />
            </g>
            <path
              d="M20 34 C9 27,3 21,3 13 C3 6.5,8 3,12.5 3 C16.5 3,19 6,20 8.5 C21 6,23.5 3,27.5 3 C32 3,37 6.5,37 13 C37 21,31 27,20 34 Z"
              fill={`url(#heart-${uid})`}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          </svg>
          <span
            className="text-[9.5px] font-black italic leading-none"
            style={{ color: c.caption, textShadow: `0 0 8px ${c.captionGlow}` }}
          >
            Aşk için bekliyor
          </span>
        </button>

        <span
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full"
          style={{ border: `2px solid ${GOLD}`, background: 'rgba(255,255,255,0.35)', boxShadow: 'inset 0 0 10px -4px rgba(212,175,55,0.9)' }}
        />
      </div>
    </div>
  );
}