import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { CHIP_LEVELS, CHIP_LABELS } from './rouletteConfig';
import RouletteChip from './RouletteChip';

/** Alt bar: bakiye (sol alt) + kedi jetonlar (orta) + REPEAT / TEMİZLE (sağ köşe). */
export default function RouletteChipRow({ coins, chip, stake, canRepeat, disabled, onChip, onRepeat, onClear, onCoins }) {
  return (
    <div className="rl2-footer-bar">
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
      <div className="rl2-actions">
        <button type="button" onClick={onRepeat} disabled={disabled || !canRepeat} className="rl2-repeat" aria-label="Bahisleri tekrarla">
          <RotateCcw className="h-3 w-3" /> REPEAT
        </button>
        <button type="button" onClick={onClear} disabled={disabled || stake <= 0} className="rl2-clear" aria-label="Bahisleri temizle">
          <Trash2 className="h-3 w-3" /> TEMİZLE
        </button>
      </div>
    </div>
  );
}