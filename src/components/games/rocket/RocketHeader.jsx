import React from 'react';
import { ArrowLeft, Calendar, CircleHelp, MoreVertical, Ticket, X } from 'lucide-react';
import { format } from './rocketConfig';
import RocketHistoryPills from './RocketHistoryPills';

/**
 * Üst şerit: ortada metalik CRASH ROCKET logosu, altında durum çubuğu —
 * solda FK Coin bakiyesi, ortada son turların çarpanları, sağda oyun defteri
 * ve tasarımdaki menü simgeleri.
 */
export default function RocketHeader({ coins, history, onBack, onExit, onLedger }) {
  return (
    <header className="shrink-0 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="relative flex items-center justify-center pb-1.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Oyun listesine dön"
          className="rk-icon-btn absolute left-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="rk-logo text-[17px] leading-none">CRASH ROCKET</span>

        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="rk-icon-btn absolute right-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rk-frame flex items-center gap-1.5 rounded-xl px-1.5 py-1">
        <span className="rk-plate flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5">
          <Ticket className="h-3 w-3 text-[#facd15]" />
          <span className="text-[11px] font-black text-white">{format(coins)}</span>
        </span>

        <RocketHistoryPills history={history} />

        <span className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onLedger}
            aria-label="Oyun defterini aç"
            className="rk-mini-btn"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          <span aria-hidden="true" className="rk-mini-btn">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <span aria-hidden="true" className="rk-mini-btn">
            <CircleHelp className="h-3.5 w-3.5" />
          </span>
        </span>
      </div>
    </header>
  );
}