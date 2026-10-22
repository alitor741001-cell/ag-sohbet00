import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Image } from '@/components/ui/image';
import { AVIATOR_PLANE } from '../rocketAssets';
import { format } from '../rocket/rocketConfig';

/** Üst bar: uçak + Aviator yazısı, coin bakiyesi ve menü. */
export default function AviatorHeader({ coins, onBack, onExit, onLedger, onHelp }) {
  return (
    <header className="av-header flex items-center gap-2 px-3 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
      <Image src={AVIATOR_PLANE} alt="" className="h-8 w-12 mix-blend-screen" fittingType="fit" />
      <h1 className="av-logo">Aviator</h1>
      <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 py-1 pl-1.5 pr-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-900">$</span>
        <span className="text-[13px] font-bold tabular-nums text-white">{format(coins)}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Plus className="h-3.5 w-3.5" /></span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/60 text-white">
          <Menu className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onLedger}>Geçmişim</DropdownMenuItem>
          <DropdownMenuItem onClick={onHelp}>Nasıl oynanır</DropdownMenuItem>
          {onBack && <DropdownMenuItem onClick={onBack}>Oyunlara dön</DropdownMenuItem>}
          {onExit && <DropdownMenuItem onClick={onExit}>Çıkış</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}