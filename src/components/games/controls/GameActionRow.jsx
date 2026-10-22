import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';
import FitGameText from '@/components/games/controls/FitGameText';
import ReferenceCoinButton from '@/components/games/controls/ReferenceCoinButton';

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
    <div className="ref-actions">
      <button type="button" onClick={buyable ? onSession : onCoins}
        disabled={active || busy} aria-label={affordable ? 'Çevirme hakkı al' : 'Coin yükle'} className="ref-banner">
        <ReferenceArt name="session" />
        <span className="ref-banner-copy"><FitGameText as="strong">{title}</FitGameText><FitGameText as="b">{sub}</FitGameText></span>
      </button>
      <ReferenceCoinButton coins={coins} onClick={onCoins} format={format} />
    </div>
  );
}