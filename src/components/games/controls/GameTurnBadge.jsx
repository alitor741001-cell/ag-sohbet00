import React from 'react';
import { Coins, Gift } from 'lucide-react';

/** Tur durumu şeridi: satın alınan çevirme hakkı sürüyorsa geri sayım, yoksa bedava turlar. */
export default function GameTurnBadge({ sessionSpins, freeSpins, accent }) {
  const session = (sessionSpins ?? 0) > 0;
  const free = (freeSpins ?? 0) > 0;
  if (!session && !free) return null;

  return (
    <p className={`flex items-center gap-1.5 rounded-full border bg-black/45 px-3 py-1 text-[10px] font-black tracking-[0.12em] ${accent}`}>
      {session ? <Coins className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
      {session ? `ÇEVİRME HAKKI · ${sessionSpins} TUR KALDI` : `BEDAVA TUR: ${freeSpins}`}
    </p>
  );
}