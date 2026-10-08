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

// Kırmızı ve siyah: bahsin adı büyük ve iki kez yazılır, uzaktan da okunur.
const BIG_LABELS = { red: true, black: true };

/** Masa: sekiz bahis bloğu 4x2 düzende durur, dokunulan bloğa jeton konar. */
export default function RouletteTable({ bets, disabled, onPlace }) {
  return (
    <div className="rl-table">
      {BLOCKS.map((block) => {
        const amount = bets[block.id] || 0;
        const big = BIG_LABELS[block.id];
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onPlace(block.id)}
            disabled={disabled}
            className={`rl-block rl-block-${TONES[block.id]} ${big ? 'rl-block-big' : ''} ${amount ? 'rl-block-armed' : ''}`}
          >
            <span className="rl-block-top">
              <span className="rl-block-sub">{block.sub}</span>
              {amount > 0 && <span className="rl-block-stake">{formatCoins(amount)}</span>}
            </span>
            <span className="rl-block-label">{block.label}</span>
            {big && (
              <span aria-hidden="true" className="rl-block-label rl-block-label-echo">
                {block.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}