import { Heart } from 'lucide-react';
import { Image } from '@/components/ui/image';

/**
 * Kartın altındaki pembe panel: solda kristal çerçeveli fotoğraf, ortada altın kanatlı
 * kalp ve "Aşk için bekliyor" yazısı, sağda altın çerçeveli hediye sayacı.
 */
export default function CompactLovePanel({ avatar, name, receivedLevel = 0, onGift }) {
  return (
    <div
      className="relative mt-2 flex items-center justify-between gap-1 rounded-[18px] border px-2 py-2"
      style={{
        borderColor: 'rgba(247,181,226,0.85)',
        background: 'linear-gradient(180deg, #fde6f4 0%, #f8cbe7 52%, #eaa8d2 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 24px -14px rgba(247,181,226,0.9)',
      }}
    >
      <span aria-hidden className="pointer-events-none absolute left-1/2 -top-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] border border-[#e5c05a] bg-[#fde6f4]" />
      <span aria-hidden className="pointer-events-none absolute -left-[5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#e5c05a]" />
      <span aria-hidden className="pointer-events-none absolute -right-[5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#e5c05a]" />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-[2px]" style={{ background: 'linear-gradient(158deg, #f2fbff, #3576b8 62%, #d9f2ff)' }}>
        <div className="h-full w-full overflow-hidden rounded-full bg-[#0b1f33]">
          {avatar
            ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full" referrerPolicy="no-referrer" />
            : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">{(name || '?')[0]}</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={onGift}
        disabled={!onGift}
        className="flex min-w-0 flex-1 flex-col items-center gap-0.5 active:scale-95 disabled:opacity-90"
      >
        <span className="relative flex items-center justify-center">
          <span aria-hidden className="absolute -left-4 top-1/2 h-[3px] w-4 -translate-y-1/2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #e5c05a)' }} />
          <span aria-hidden className="absolute -right-4 top-1/2 h-[3px] w-4 -translate-y-1/2 rounded-full" style={{ background: 'linear-gradient(270deg, transparent, #e5c05a)' }} />
          <Heart className="h-6 w-6 drop-shadow" style={{ color: '#f06ba8' }} fill="#f06ba8" />
        </span>
        <span className="text-[9px] font-black leading-none" style={{ color: '#7a2a52' }}>Aşk için bekliyor</span>
      </button>

      <div
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border-2"
        style={{ borderColor: '#d4af37', background: 'linear-gradient(180deg, #fff4d6, #f2d79c)', color: '#7a4a10' }}
      >
        <Heart className="h-3 w-3" fill="currentColor" />
        <span className="text-[10px] font-black leading-none tabular-nums">{receivedLevel}</span>
      </div>
    </div>
  );
}