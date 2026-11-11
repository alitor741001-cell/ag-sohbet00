import React from 'react';
import { RotateCw } from 'lucide-react';
import FitGameText from '@/components/games/controls/FitGameText';
import ReferenceCoinButton from '@/components/games/controls/ReferenceCoinButton';
import '@/components/games/controls/referenceControls.css';

/** Eylem sırası: solda bahis kademesine göre bedeli düşülen çevirme hakkı, sağda coin yükleme.
    Bakiye yetmiyorsa sol düğme doğrudan coin yüklemeye yönlendirir. */
export default function GameActionRow({ coins, sessionPrice, sessionSpins, sessionSize, busy, onSession, onCoins, format }) {
  const active = (sessionSpins ?? 0) > 0;
  const affordable = (coins ?? 0) >= (sessionPrice ?? 0);
  const buyable = affordable && !active;

  const title = active
    ? `ÇEVRİLİYOR · ${sessionSpins}`
    : `${sessionSize} ÇEVİRME PAKETİ`;
  const sub = active
    ? `${sessionSpins} TUR KALDI`
    : `${Math.round((sessionPrice || 0) / 1000)}K COIN`;

  return (
    <div className="ref-actions">
      <button type="button" onClick={buyable ? onSession : onCoins}
        disabled={active || busy} aria-label={affordable ? 'Çevirme hakkı al' : 'Coin yükle'} className="ref-banner pc-glass">
        <span className="ref-banner-shine" aria-hidden="true" />
        <span className="ref-banner-icon"><RotateCw strokeWidth={3} className={active ? 'animate-spin' : ''} /></span>
        <span className="ref-banner-copy"><FitGameText as="strong">{title}</FitGameText><FitGameText as="b">{sub}</FitGameText></span>
      </button>
      <ReferenceCoinButton coins={coins} onClick={onCoins} format={format} />
    </div>
  );
}