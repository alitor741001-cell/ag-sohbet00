import React from 'react';
import AnkaSymbol from '@/components/games/anka/AnkaSymbol';
import { INITIAL_GRID, SYMBOL_IDS } from '@/components/games/anka/ankaConfig';
export default function AnkaReels({ game }) {
  const grid = game.grid || INITIAL_GRID;
  const winners = new Set((game.wins || []).flatMap(win => win.cells.map(cell => `${cell.reel}:${cell.row}`)));
  return <div className="anka-reels" aria-label="Üç makara" aria-busy={game.rolling}>
    {grid.map((column, reel) => <div key={reel} className={`anka-reel anka-reel-${reel} ${game.rolling ? 'anka-rolling' : ''}`}>
      <div className="anka-reel-track" style={{ '--anka-rows': column.length, '--anka-delay': `${reel * -0.11}s` }}>
        {(game.rolling ? [...column, ...column, ...column] : column).map((symbol, row) => <div key={row} className={`anka-cell ${!game.rolling && winners.has(`${reel}:${row}`) ? 'anka-cell-win' : ''}`}>
          <AnkaSymbol symbol={game.rolling ? SYMBOL_IDS[(row + reel) % SYMBOL_IDS.length] : symbol} />
        </div>)}
      </div>
    </div>)}
  </div>;
}