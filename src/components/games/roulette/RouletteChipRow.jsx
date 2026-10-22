import React from 'react';
import { Cat, RotateCcw } from 'lucide-react';
import { CHIP_LABELS, CHIP_LEVELS, formatCoins } from './rouletteConfig';

const CHIP_TONES = {
  500: 'green',
  1000: 'blue',
  10000: 'pink',
  100000: 'black',
};

/** Alt bar: bakiye (sol) + renkli jetonlar (orta) + REPEAT (sağ). */
export default function RouletteChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="rl-footer-bar">
      <button type="button" onClick={onCoins} className="rl-balance" aria-label="Coin yükle">
        <Cat className="h-4 w-4 rl-balance-icon" />
        <span className="rl-balance-value">{formatCoins(coins)}</span>
      </button>
      <div className="rl-chips">
        {CHIP_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChip(level)}
            disabled={disabled}
            aria-label={`${CHIP_LABELS[level]} jeton`}
            aria-pressed={chip === level}
            className={`rl-chip rl-chip-${CHIP_TONES[level]} ${chip === level ? 'rl-chip-on' : ''}`}
          >
            {CHIP_LABELS[level]}
          </button>
        ))}
      </div>
      <button type="button" onClick={onRepeat} disabled={disabled || !canRepeat} className="rl-repeat" aria-label="Bahisleri tekrarla">
        <RotateCcw className="h-3.5 w-3.5" /> REPEAT
      </button>
      {stake > 0 && (
        <button type="button" onClick={onClear} disabled={disabled} className="rl-clear" aria-label="Bahisleri temizle">
          TEMİZLE
        </button>
      )}
    </div>
  );
}