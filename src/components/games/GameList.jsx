import React from 'react';
import { GAME_CATALOG } from './gameCatalog';
import GameCardTile from './GameCardTile';

export default function GameList({ onSelect }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slot-gold/80">Yüklenen oyunlar</p>
      <div className="grid grid-cols-2 gap-3">
        {GAME_CATALOG.map((game) => (
          <GameCardTile key={game.id} game={game} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}