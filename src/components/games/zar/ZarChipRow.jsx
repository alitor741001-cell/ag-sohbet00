import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import ReferenceChoiceButton from '@/components/games/controls/ReferenceChoiceButton';
import ReferenceCoinButton from '@/components/games/controls/ReferenceCoinButton';
import { CHIP_LABELS, CHIP_LEVELS, formatCoins } from './zarConfig';

export default function ZarChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="ref-chip-layout">
      <div className="ref-chip-top">
        <ReferenceCoinButton coins={coins} onClick={onCoins} format={formatCoins} />
        <span className="ref-chip-stake">MASA {formatCoins(stake)}</span>
      </div>
      <div className="ref-chip-list">
        {CHIP_LEVELS.map((level) => (
          <ReferenceChoiceButton key={level} onClick={() => onChip(level)} disabled={disabled} aria-label={`${formatCoins(level)} jeton`} aria-pressed={chip === level}>{CHIP_LABELS[level]}</ReferenceChoiceButton>
        ))}
      </div>
      <div className="ref-chip-actions">
        <ReferenceChoiceButton onClick={onRepeat} disabled={disabled || !canRepeat}><RotateCcw className="h-3.5 w-3.5" /> TEKRAR</ReferenceChoiceButton>
        <ReferenceChoiceButton onClick={onClear} disabled={disabled || !stake}><Trash2 className="h-3.5 w-3.5" /> TEMİZLE</ReferenceChoiceButton>
      </div>
    </div>
  );
}