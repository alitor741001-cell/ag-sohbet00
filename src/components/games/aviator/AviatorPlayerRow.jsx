import React from 'react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from '../rocket/rocketConfig';


/** Oyuncu satırı: avatar, isim, coin ve çektiyse yeşil çarpan rozeti. */
export default function AviatorPlayerRow({ bet }) {
  const cashed = bet.status === 'cashed';
  return (
    <div className="flex items-center gap-2 border-b border-white/5 py-1.5">
      <span className={`shrink-0 rounded-full p-[2px] ${cashed ? 'bg-emerald-400' : 'bg-sky-500/70'}`}>
        {bet.user_avatar
          ? <Image src={bet.user_avatar} alt="" className="h-8 w-8 rounded-full" fittingType="fill" />
          : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-black text-white/70">{(bet.user_name || '?').charAt(0).toUpperCase()}</span>}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[10px] text-white/80"><span className="text-amber-400">●</span> {format(bet.bet)}</p>
        {cashed && <span className="mt-0.5 inline-block rounded-md bg-emerald-500/20 px-1.5 text-[10px] font-bold text-emerald-400">{formatMult(bet.cashout_at)}</span>}
      </div>
    </div>
  );
}