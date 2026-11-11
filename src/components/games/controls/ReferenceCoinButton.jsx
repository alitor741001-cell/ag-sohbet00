import React from 'react';
import { Plus } from 'lucide-react';
import FitGameText from '@/components/games/controls/FitGameText';
import '@/components/games/controls/referenceControls.css';

export default function ReferenceCoinButton({ coins, onClick, format }) {
  return (
    <button type="button" onClick={onClick} aria-label="Coin yükle" className="ref-banner ref-banner-coins pc-glass">
      <span className="ref-banner-shine" aria-hidden="true" />
      <span className="ref-banner-icon"><Plus strokeWidth={3} /></span>
      <span className="ref-banner-copy"><FitGameText as="strong">COİN YÜKLE</FitGameText><FitGameText as="b">{format(coins ?? 0)}</FitGameText></span>
    </button>
  );
}