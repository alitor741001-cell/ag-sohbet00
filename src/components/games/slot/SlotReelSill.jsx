import React from 'react';
import { SLOT_LAYOUT } from '@/components/games/slot/slotLayout';

/** Makaraların altını üstteki kabin kenarı gibi kapatan alt kapak. */
export default function SlotReelSill() {
  return (
    <span aria-hidden="true" className="slot-reel-sill pointer-events-none absolute" style={SLOT_LAYOUT.reelSill}>
      <span className="slot-reel-sill-trim" />
    </span>
  );
}