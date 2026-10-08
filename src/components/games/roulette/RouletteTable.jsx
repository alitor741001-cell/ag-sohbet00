import React from 'react';
import { BLOCKS, formatCoins } from './rouletteConfig';

// Blok zemini: 0 yeşil, renk bahisleri kendi renginde, sayı grupları altın zeminli.
const TONES = {
  zero: 'green',
  dozen1: 'gold',
  dozen2: 'gold',
  dozen3: 'gold',
  red: 'red',
  black: 'black',
  even: 'gold',
  odd: 'gold',
};

/** Masa: sekiz bahis bloğu 4x2 düzende durur, dokunulan bloğa jeton konar. */
export default function RouletteTable({ bets, disabled, onPlace }) {
  return (
    <div className="rl-table">
      {BLOCKS.map((block) => {
        const amount = bets[block.id] || 0;
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onPlace(block.id)}
            disabled={disabled}
            className={`rl-block rl-block-${TONES[block.id]} ${amount ? 'rl-block-armed' : ''}`}
          >
            <span className="rl-block-top">
              <span className="rl-block-sub">{block.sub}</span>
              {amount > 0 && <span className="rl-block-stake">{formatCoins(amount)}</span>}
            </span>
            <span className="rl-block-label">{block.label}</span>
          </button>
        );
      })}
    </div>
  );
}