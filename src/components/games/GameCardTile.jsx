import React from 'react';
import { Image } from '@/components/ui/image';

export default function GameCardTile({ game, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(game)}
      className="overflow-hidden rounded-2xl border border-slot-border bg-slot-surface shadow-lg transition-transform active:scale-95"
    >
      <div className="aspect-square w-full">
        <Image src={game.logo} alt={game.title} className="h-full w-full" fittingType="fill" />
      </div>
    </button>
  );
}