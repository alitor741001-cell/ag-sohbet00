import React from 'react';
import { CircleHelp, Coins, Menu, Settings } from 'lucide-react';
import { formatCoins } from './luckyConfig';

// Görseldeki üst şeridin üzerine oturan canlı katman: bakiye, seviye ve üst simgeler.
export default function LuckyHeader({ coins, freeSpins, onOpen }) {
  return (
    <div className="flex h-full w-full items-center gap-1.5 px-2">
      <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-slot-gold/50 bg-black/65 px-2 py-1 backdrop-blur-sm">
        <Coins className="h-4 w-4 shrink-0 text-slot-gold" />
        <span className="slot-digits truncate text-sm font-black text-white">{formatCoins(coins)}</span>
      </div>

      {freeSpins > 0 && (
        <span className="lucky-free-badge flex shrink-0 items-center gap-1 rounded-full border border-slot-green/70 bg-black/70 px-2 py-1 text-[0.65rem] font-black text-slot-green">
          ÜCRETSİZ {freeSpins}
        </span>
      )}

      <span className="flex-1" />

      <button
        type="button"
        onClick={() => onOpen('help')}
        aria-label="Oyun kuralları"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slot-gold/40 bg-black/65 text-slot-gold"
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onOpen('menu')}
        aria-label="Menü"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slot-gold/40 bg-black/65 text-slot-gold"
      >
        <Menu className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onOpen('settings')}
        aria-label="Ayarlar"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slot-gold/40 bg-black/65 text-slot-gold"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}