import React from 'react';
import { ChevronLeft, HelpCircle, Plus, Volume2, VolumeX } from 'lucide-react';
import { Image } from '@/components/ui/image';
import GameIconButton from '../controls/GameIconButton';
import { AVIATOR_PLANE } from '../rocketAssets';
import { format } from '../rocket/rocketConfig';

/** Üst bar: logo, tıklanabilir coin bakiyesi, ? yardım ve menü (ses dahil). */
export default function AviatorHeader({ coins, sound, onCoins, onBack, onExit, onLedger, onHelp }) {
  return (
    <header className="av-header flex items-center gap-2 px-3 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
      {(onBack || onExit) && (
        <GameIconButton label="Geri" onClick={onBack || onExit}>
          <ChevronLeft className="h-4 w-4" />
        </GameIconButton>
      )}
      <Image src={AVIATOR_PLANE} alt="" className="h-8 w-12 mix-blend-screen" fittingType="fit" />
      <h1 className="av-logo">Gökkartal</h1>
      <button type="button" onClick={onCoins} className="ml-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 py-1 pl-1.5 pr-1 active:scale-95">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-900">$</span>
        <span className="text-[13px] font-bold tabular-nums text-white">{format(coins)}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Plus className="h-3.5 w-3.5" /></span>
      </button>
      <GameIconButton label="Nasıl oynanır" onClick={onHelp}>
        <HelpCircle className="h-4 w-4" />
      </GameIconButton>
      <GameIconButton label={sound.on ? 'Sesi kapat' : 'Sesi aç'} active={sound.on} onClick={sound.toggle}>
        {sound.on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </GameIconButton>
    </header>
  );
}