import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';

export default function ReferenceCoinButton({ coins, onClick, format }) {
  return (
    <button type="button" onClick={onClick} aria-label="Coin yükle" className="ref-banner ref-banner-coins">
      <ReferenceArt name="coins" />
      <span className="ref-banner-copy"><strong>COİN YÜKLE</strong><b>{format(coins ?? 0)}</b></span>
    </button>
  );
}