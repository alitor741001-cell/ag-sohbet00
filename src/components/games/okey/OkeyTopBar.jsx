import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Timer, Trophy } from 'lucide-react';
import { clockOf, formatBet } from './okeyConfig';
import ReferenceCoinButton from '@/components/games/controls/ReferenceCoinButton';

/** Üst çubuk: pot, bakiye, tur süresi, mağaza ve kapatma. */
export default function OkeyTopBar({ variant = 'okey101', table, coins, onStore, onBack, onExit }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <header className="okey-head">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="okey-round">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="okey-title">
          <span className="okey-title-name">{variant === 'okey' ? 'OKEY' : '101 OKEY'}</span>
          <span className="okey-title-sub">MASA {table?.code || '----'} · BAHİSLİ · TEKLİ</span>
        </span>

      </header>

      <div className="okey-chips">
        <span className="okey-chip">
          <Trophy className="h-3.5 w-3.5 text-[#ffd76a]" />
          <span className="okey-chip-label">POT</span>
          <span className="okey-chip-value">{formatBet(table?.pot || 0)}</span>
        </span>
        <span className="okey-chip">
          <Coins className="h-3.5 w-3.5 text-[#ffd76a]" />
          <span className="okey-chip-label">COIN</span>
          <span className="okey-chip-value">{formatBet(coins)}</span>
        </span>
        <span className="okey-chip">
          <Timer className="h-3.5 w-3.5 text-[#7df5a8]" />
          <span className="okey-chip-time">{clockOf(table?.deadline, now)}</span>
        </span>
        <div className="ml-auto w-36"><ReferenceCoinButton coins={coins} onClick={onStore} format={formatBet} /></div>
      </div>
    </>
  );
}