import React from 'react';
import { BLOCKS, shortCoins, blockWins } from './rouletteConfig';
import RouletteChip from './RouletteChip';

const MULT = { zero: 36, dozen1: 3, dozen2: 3, dozen3: 3 };

/** Masa: sekiz bordo bahis bloğu 4x2 düzende; solda kazanç, sağda yatırılan tutar. */
export default function RouletteTable({ bets, disabled, onPlace, resultNumber }) {
  return (
    <div className="rl2-table">
      {BLOCKS.map((block) => {
        const amount = bets[block.id] || 0;
        const won = amount > 0 && blockWins(block.id, resultNumber) ? amount * (MULT[block.id] || 2) : 0;
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onPlace(block.id)}
            disabled={disabled}
            className={`rl2-block ${won ? 'rl2-block-win' : ''}`}
          >
            <span className="rl2-block-top">
              <span className="rl2-block-won">{shortCoins(won)}</span>
              <span className="rl2-block-stake">{shortCoins(amount)}</span>
            </span>
            <span className="rl2-block-label">{block.label}</span>
            <span className="rl2-block-sub">{block.sub}</span>
            {amount > 0 && (
              <span className="rl2-block-chip">
                <RouletteChip value={amount} small />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}