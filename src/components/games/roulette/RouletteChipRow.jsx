import React from 'react';
import { Coins, Plus, RotateCcw } from 'lucide-react';
import { CHIP_LABELS, CHIP_LEVELS, formatCoins } from './rouletteConfig';

/** Jeton sırası: bakiye, jeton kademeleri, REPEAT ve TEMİZLE. */
export default function RouletteChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCoins} aria-label="Coin yükle" className="rl-balance">
          <span className="gctl-coin">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="rl-balance-value">{formatCoins(coins)}</span>
        </button>
        <span className="rl-stake">
          <Coins className="h-3.5 w-3.5" /> MASA {formatCoins(stake)}
        </span>
      </div>

      <div className="rl-chips">
        {CHIP_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChip(level)}
            disabled={disabled}
            aria-label={`${formatCoins(level)} jeton`}
            className={`rl-chip ${chip === level ? 'rl-chip-on' : ''}`}
          >
            {CHIP_LABELS[level]}
          </button>
        ))}
        <button type="button" onClick={onRepeat} disabled={disabled || !canRepeat} className="rl-repeat">
          <RotateCcw className="h-3.5 w-3.5" /> REPEAT
        </button>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onClear} disabled={disabled || !stake} className="rl-clear">
          TEMİZLE
        </button>
      </div>
    </div>
  );
}