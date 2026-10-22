import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';
import FitGameText from '@/components/games/controls/FitGameText';

export default function ReferenceCoinButton({ coins, onClick, format }) {
  return (
    <button type="button" onClick={onClick} aria-label="Coin yükle" className="ref-banner ref-banner-coins">
      <ReferenceArt name="coins" />
      <span className="ref-banner-copy"><FitGameText as="strong">COİN YÜKLE</FitGameText><FitGameText as="b">{format(coins ?? 0)}</FitGameText></span>
    </button>
  );
}