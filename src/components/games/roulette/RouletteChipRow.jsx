import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CHIP_LEVELS, CHIP_LABELS, formatCoins } from './rouletteConfig';
import RouletteChip from './RouletteChip';

/** Alt bar: bakiye (sol alt) + kedi jetonlar (orta) + gri REPEAT (sağ). */
export default function RouletteChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="rl2-footer-bar">
      <button type="button" onClick={onCoins} className="rl2-balance" aria-label="Coin yükle">
        <span className="rl2-balance-icon" />
        {formatCoins(coins)}
        <ChevronRight className="h-3 w-3" />
      </button>
      <div className="rl2-chips">
        {CHIP_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChip(level)}
            disabled={disabled}
            aria-label={`${CHIP_LABELS[level]} jeton`}
            aria-pressed={chip === level}
            className={`rl2-chip-btn ${chip === level ? 'rl2-chip-btn-on' : ''}`}
          >
            <RouletteChip value={level} />
          </button>
        ))}
      </div>
      {stake > 0 && !disabled ? (
        <button type="button" onClick={onClear} className="rl2-repeat">TEMİZLE</button>
      ) : (
        <button type="button" onClick={onRepeat} disabled={disabled || !canRepeat} className="rl2-repeat">REPEAT</button>
      )}
    </div>
  );
}