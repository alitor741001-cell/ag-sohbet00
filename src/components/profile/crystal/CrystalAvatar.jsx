import { useId } from 'react';
import { Image } from '@/components/ui/image';
import { GOLD_LINE, crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Kristal kanat: fotoğrafın iki yanından dışa doğru açılan tüyler. */
const FEATHER = 'M52 6C34 14 20 28 8 50c10-3 19-10 25-19 3 11 1 22-5 31 10-6 17-17 19-29 2-9 4-18 5-27Z';
const FEATHER2 = 'M40 58C30 66 22 76 18 88c7-3 13-9 16-16 2 5 1 11-1 16 7-6 11-14 11-22 0-4-4-6-4-8Z';

/** Referanstaki fotoğraf bölümü: altın halka, kristal kanatlar, taç, cinsiyet rozeti ve VIP etiketi. */
export default function CrystalAvatar({ avatar, name, genderSymbol = '♂', vipLevel = 0, tone = 'blue' }) {
  const c = crystalSkin(tone);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className="relative mx-auto flex w-full flex-col items-center">
      <div className="relative h-[104px] w-[104px]">
        <svg
          aria-hidden
          viewBox="0 0 132 100"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 226, height: 138 }}
        >
          <defs>
            <linearGradient id={`wing-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c.wing[0]} />
              <stop offset="44%" stopColor={c.wing[1]} />
              <stop offset="100%" stopColor={c.wing[2]} />
            </linearGradient>
          </defs>
          <g fill={`url(#wing-${uid})`} stroke="rgba(212,175,55,0.5)" strokeWidth="0.9" opacity="0.95">
            <path d={FEATHER} transform="translate(6,4)" />
            <path d={FEATHER2} transform="translate(6,0)" opacity="0.88" />
            <g transform="translate(126,0) scale(-1,1)">
              <path d={FEATHER} transform="translate(6,4)" />
              <path d={FEATHER2} transform="translate(6,0)" opacity="0.88" />
            </g>
          </g>
        </svg>

        <svg aria-hidden viewBox="0 0 40 24" className="absolute left-1/2 top-[-15px] z-[3] -translate-x-1/2" style={{ width: 30, height: 18 }}>
          <defs>
            <linearGradient id={`crown-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff6d6" />
              <stop offset="50%" stopColor="#e9ca6c" />
              <stop offset="100%" stopColor="#a67c1f" />
            </linearGradient>
          </defs>
          <path d="M2 19 L6 6 L13 13 L20 3 L27 13 L34 6 L38 19 Z" fill={`url(#crown-${uid})`} stroke="rgba(255,246,214,0.85)" strokeWidth="1" strokeLinejoin="round" />
          <circle cx="6" cy="6" r="1.9" fill="#fff8dd" />
          <circle cx="20" cy="3" r="2.1" fill="#fff8dd" />
          <circle cx="34" cy="6" r="1.9" fill="#fff8dd" />
        </svg>

        <div className="relative h-full w-full rounded-full p-[3px]" style={{ background: GOLD_LINE, boxShadow: `0 0 26px -6px ${c.glow}` }}>
          <div className="h-full w-full overflow-hidden rounded-full p-[2px]" style={{ background: '#050a14' }}>
            {avatar
              ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full rounded-full" referrerPolicy="no-referrer" />
              : <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1f3c] text-3xl font-black text-white/80">{(name || '?')[0]}</span>}
          </div>
        </div>

        <span
          className="absolute -bottom-[3px] -right-[3px] z-[3] flex h-[23px] w-[23px] items-center justify-center rounded-full text-[11px] font-black text-white"
          style={{ background: c.genderFill, border: '1.5px solid #f4dda4', boxShadow: `0 0 12px -2px ${c.glow}` }}
        >
          {genderSymbol}
        </span>
      </div>

      {vipLevel > 0 && (
        <span
          className="relative z-[3] -mt-2 whitespace-nowrap rounded-full px-3 py-[2px] text-[10px] font-black tracking-[0.12em] text-[#2a1f04]"
          style={{ background: GOLD_LINE, border: '1px solid #fff3cf', boxShadow: '0 2px 10px -2px rgba(245,213,138,0.9)' }}
        >
          VIP{vipLevel}
        </span>
      )}
    </div>
  );
}