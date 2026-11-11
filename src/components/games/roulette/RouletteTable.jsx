import React from 'react';
import { BLOCKS, shortCoins, blockWins } from './rouletteConfig';
import RouletteChip from './RouletteChip';

const MULT = { zero: 36, dozen1: 3, dozen2: 3, dozen3: 3 };
// Blokta gösterilecek en fazla rakip jetonu: masa taşmaz.
const MAX_OTHERS = 3;

/** Masa: sekiz bordo bahis bloğu 4x2 düzende; solda kazanç, sağda masadaki toplam.
    Kendi jetonu büyük, diğer oyuncuların jetonları küçük altın rozetlerle görünür. */
export default function RouletteTable({ bets, others, disabled, onPlace, resultNumber }) {
  return (
    <div className="rl2-table">
      {BLOCKS.map((block) => {
        const own = bets[block.id] || 0;
        const list = others?.[block.id] || [];
        const shared = list.reduce((sum, chip) => sum + (chip.stake || 0), 0);
        const amount = own + shared;
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
            {own > 0 && (
              <span className="rl2-block-chip">
                <RouletteChip value={own} small />
              </span>
            )}
            {list.length > 0 && (
              <span className="rl2-block-others">
                {list.slice(0, MAX_OTHERS).map((chip, index) => (
                  <span key={`${chip.user_id}-${index}`} className="rl2-other-chip">
                    {shortCoins(chip.stake)}
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}