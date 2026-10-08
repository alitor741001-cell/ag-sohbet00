import React from 'react';
import { ArrowLeft, HelpCircle, Wallet, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ROCKET_LOGO } from '@/components/games/rocketAssets';

/** Üst şerit: geri tuşu, oyun arması, nasıl oynanır, oyun defteri ve kapatma tuşu. */
export default function RocketHeader({ onBack, onExit, onLedger, onHelp }) {
  return (
    <header className="rk-topbar relative z-20 flex items-center gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="rk-icon-btn">
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <Image
          src={ROCKET_LOGO}
          alt=""
          aria-hidden="true"
          className="rk-emblem"
          fittingType="fill"
          quality={80}
        />
        <span className="flex min-w-0 flex-col items-start leading-none">
          <span className="rk-title truncate">ROCKET</span>
          <span className="rk-title-sub">GERÇEK UÇUŞ KONSOLU</span>
        </span>
      </div>

      <button type="button" onClick={onLedger} aria-label="Oyun defterini aç" className="rk-icon-btn">
        <Wallet className="h-4 w-4" />
      </button>
      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="rk-icon-btn">
        <HelpCircle className="h-4 w-4" />
      </button>
      <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="rk-icon-btn">
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}