import React, { useState } from 'react';
import { ChevronLeft, Gamepad2, X } from 'lucide-react';
import GameList from './GameList';
import SlotGame from './SlotGame';

export default function GamePanel({ open, onClose }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-[185] flex w-full flex-col bg-slot text-slot-text shadow-2xl sm:w-[30rem] sm:border-l sm:border-slot-border">
      <header className="flex shrink-0 items-center gap-2 border-b border-slot-border bg-slot-surface px-3 py-2.5">
        {selected ? (
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Oyun listesine dön"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slot-panel"
          >
            <ChevronLeft className="h-5 w-5 text-slot-gold" />
          </button>
        ) : (
          <Gamepad2 className="h-5 w-5 text-slot-gold" />
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-black tracking-wide">
          {selected ? selected.title : 'Oyun Merkezi'}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Oyun panelini kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slot-panel"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {selected ? <SlotGame /> : <GameList onSelect={setSelected} />}
    </div>
  );
}