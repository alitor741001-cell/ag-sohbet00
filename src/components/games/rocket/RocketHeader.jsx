import React from 'react';
import { ArrowLeft, Rocket, Wallet, X } from 'lucide-react';

/** Üst şerit: geri tuşu, oyun arması, oyun defteri ve kapatma tuşu. */
export default function RocketHeader({ onBack, onExit, onLedger }) {
  return (
    <header className="rk-topbar relative z-20 flex items-center gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="rk-icon-btn">
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <span className="rk-emblem" aria-hidden="true">
          <Rocket className="h-3.5 w-3.5" />
        </span>
        <span className="flex min-w-0 flex-col items-start leading-none">
          <span className="rk-title truncate">CRASH ROCKET</span>
          <span className="rk-title-sub">GERÇEK UÇUŞ KONSOLU</span>
        </span>
      </div>

      <button type="button" onClick={onLedger} aria-label="Oyun defterini aç" className="rk-icon-btn">
        <Wallet className="h-4 w-4" />
      </button>
      <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="rk-icon-btn">
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}