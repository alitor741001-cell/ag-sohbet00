import { useId } from 'react';
import { Image } from '@/components/ui/image';
import { vipStyle } from '@/lib/userLevels';
import { compactTone } from '@/components/profile/compact/compactTheme';

/** Kristal kanat: fotoğrafın iki yanına yayılan metalik tüyler. */
const WING = 'M58 54 C34 44,14 54,6 76 M56 68 C30 62,10 76,4 100 M58 82 C34 86,16 104,12 126';

/**
 * Kompakt kartın ortasındaki fotoğraf: iki koltuk boyunda, iki yanında kristal kanatlar,
 * çevresinde elmas uçlar ve tabanında VIP etiketi.
 */
export default function CompactCrystalAvatar({ avatar, name, vipLevel = 0, tone = 'pink' }) {
  const c = compactTone(tone);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const vip = vipLevel > 0 ? vipStyle(vipLevel) : null;

  return (
    <div className="relative mx-auto h-[124px] w-[124px] shrink-0">
      {/* Kanatlar fotoğrafın arkasında açılır. */}
      <svg
        aria-hidden
        viewBox="0 0 240 160"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 224, height: 150 }}
      >
        <defs>
          <linearGradient id={`wing-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="32%" stopColor={c.light} />
            <stop offset="68%" stopColor={c.mid} />
            <stop offset="100%" stopColor={c.deep} />
          </linearGradient>
        </defs>
        <g fill="none" stroke={`url(#wing-${uid})`} strokeLinecap="round" strokeWidth="5.5" opacity="0.95">
          <path d={WING} />
          <path d={WING} transform="translate(240,0) scale(-1,1)" />
        </g>
        <g fill={`url(#wing-${uid})`} opacity="0.75">
          <circle cx="5" cy="77" r="3.4" />
          <circle cx="3" cy="101" r="3" />
          <circle cx="11" cy="127" r="2.6" />
          <circle cx="235" cy="77" r="3.4" />
          <circle cx="237" cy="101" r="3" />
          <circle cx="229" cy="127" r="2.6" />
        </g>
      </svg>

      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full"
        style={{ boxShadow: `0 0 34px -6px ${c.soft}` }}
      />

      {/* Elmas uçlar: üst, alt ve iki yan. */}
      <span aria-hidden className="pointer-events-none absolute left-1/2 -top-[7px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px]" style={{ background: c.crystal, boxShadow: `0 0 8px ${c.mid}` }} />
      <span aria-hidden className="pointer-events-none absolute -left-[7px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[2px]" style={{ background: c.crystal, boxShadow: `0 0 8px ${c.mid}` }} />
      <span aria-hidden className="pointer-events-none absolute -right-[7px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[2px]" style={{ background: c.crystal, boxShadow: `0 0 8px ${c.mid}` }} />

      <div
        className="relative h-full w-full rounded-full p-[3px]"
        style={{ background: c.crystal, boxShadow: c.crystalGlow }}
      >
        <div className="h-full w-full rounded-full p-[2px]" style={{ background: 'linear-gradient(180deg, #0b1220, #05080f)' }}>
          <div className="h-full w-full overflow-hidden rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.78)' }}>
            {avatar
              ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full" referrerPolicy="no-referrer" />
              : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-4xl font-bold text-white">{(name || '?')[0]}</span>}
          </div>
        </div>
      </div>

      {vip && (
        <span
          className="absolute -bottom-1.5 left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-2.5 py-[1px] text-[9px] font-black tracking-wider"
          style={{ borderColor: vip.border, background: vip.background, color: vip.color }}
        >
          VIP{vipLevel}
        </span>
      )}
    </div>
  );
}