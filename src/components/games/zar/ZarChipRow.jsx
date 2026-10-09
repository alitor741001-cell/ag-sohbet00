import React from 'react';
import { Coins, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { CHIP_LABELS, CHIP_LEVELS, CHIP_TONES, formatCoins } from './zarConfig';

/** Jeton sırası: bakiye, dört jeton kademesi, TEKRAR ve TEMİZLE.
    Seçili jeton parlar ve üstünde yukarı bakan ok durur. */
export default function ZarChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="zar-dock">
      <div className="zar-dock-top">
        <button type="button" onClick={onCoins} aria-label="Coin yükle" className="zar-balance">
          <span className="zar-balance-plus">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="zar-balance-value">{formatCoins(coins)}</span>
        </button>
        <span className="zar-dock-stake">
          <Coins className="h-3.5 w-3.5" /> MASA {formatCoins(stake)}
        </span>
      </div>

      <div className="zar-chips">
        {CHIP_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChip(level)}
            disabled={disabled}
            aria-label={`${formatCoins(level)} jeton`}
            aria-pressed={chip === level}
            className={`zar-chip zar-chip-${CHIP_TONES[level]}${chip === level ? ' zar-chip-on' : ''}`}
          >
            {chip === level ? <span aria-hidden="true" className="zar-chip-arrow" /> : null}
            <span className="zar-chip-value">{CHIP_LABELS[level]}</span>
          </button>
        ))}
      </div>

      <div className="zar-dock-actions">
        <button type="button" onClick={onRepeat} disabled={disabled || !canRepeat} className="zar-action">
          <RotateCcw className="h-3.5 w-3.5" /> TEKRAR
        </button>
        <button type="button" onClick={onClear} disabled={disabled || !stake} className="zar-action">
          <Trash2 className="h-3.5 w-3.5" /> TEMİZLE
        </button>
      </div>
    </div>
  );
}