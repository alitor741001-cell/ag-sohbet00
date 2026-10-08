import React from 'react';
import { Coins, Gift, Plus } from 'lucide-react';
import '@/styles/gameControls.css';

/** Eylem sırası: solda bahis kademesine göre bedeli düşülen çevirme hakkı, sağda coin yükleme.
    Bakiye yetmiyorsa sol düğme doğrudan coin yüklemeye yönlendirir. */
export default function GameActionRow({ coins, sessionPrice, sessionSpins, sessionSize, busy, onSession, onCoins, format }) {
  const active = (sessionSpins ?? 0) > 0;
  const affordable = (coins ?? 0) >= (sessionPrice ?? 0);
  const buyable = affordable && !active;

  const title = active
    ? `ÇEVRİLİYOR · ${sessionSpins}`
    : affordable ? `${sessionSize} ÇEVRİME HAKKI` : 'YETERSİZ COIN';
  const sub = active
    ? `${sessionSpins} TUR KALDI`
    : affordable ? `${format(sessionPrice)} COIN` : 'COIN YÜKLE';

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        onClick={buyable ? onSession : onCoins}
        disabled={active || busy}
        aria-label={affordable ? 'Çevirme hakkı al' : 'Coin yükle'}
        className={`gctl-action ${buyable ? 'gctl-action-gold' : ''}`}
      >
        {buyable ? <Gift className="h-4 w-4 shrink-0" /> : <Coins className="gctl-coin h-4 w-4" />}
        <span className="gctl-action-body">
          <span className="gctl-action-title">{title}</span>
          <span className="gctl-action-price">{sub}</span>
        </span>
      </button>

      <button type="button" onClick={onCoins} aria-label="Coin yükle" className="gctl-action">
        <span className="gctl-coin">
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="gctl-action-body">
          <span className="gctl-action-title">COIN YÜKLE</span>
          <span className="gctl-action-price">{format(coins ?? 0)}</span>
        </span>
      </button>
    </div>
  );
}