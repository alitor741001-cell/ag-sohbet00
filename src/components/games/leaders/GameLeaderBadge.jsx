import React, { useState } from 'react';
import LeaderAvatar from './LeaderAvatar';
import GameLeaderSheet from './GameLeaderSheet';
import useGameLeaders from './useGameLeaders';

/** Sol üstteki NO:1 rozeti: en çok kazananın profili, dokununca kazanan listeleri açılır. */
export default function GameLeaderBadge({ game, title }) {
  const { leaders, top, reload } = useGameLeaders(game);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { reload(); setOpen(true); }}
        aria-label="Kazananları gör"
        className="absolute left-2 top-2 z-30 flex flex-col items-center"
      >
        <span className="rounded-full bg-gradient-to-b from-[#ffeaa6] via-[#e8b95a] to-[#8a5a14] p-[3px] shadow-[0_0_14px_rgba(255,200,80,0.7)]">
          <LeaderAvatar leader={top} className="h-11 w-11 text-xl" />
        </span>
        <span className="-mt-2 rounded-full bg-gradient-to-b from-[#ffeaa6] to-[#c99020] px-2 text-[10px] font-black leading-4 text-[#2b1602]">NO:1</span>
      </button>
      <GameLeaderSheet open={open} title={title} leaders={leaders} onClose={() => setOpen(false)} />
    </>
  );
}