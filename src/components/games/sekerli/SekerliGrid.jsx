import React from 'react';
import SekerliReel from './SekerliReel';

/** Oyun alanı: 5 sütun x 4 satır makara ızgarası. */
export default function SekerliGrid({ game }) {
  return (
    <div className="sl-board">
      {game.board.map((column, reel) => (
        <SekerliReel
          key={reel}
          reel={reel}
          column={column}
          spinning={game.spinning}
          stopping={game.stopping}
          winCells={game.winCells}
          newCells={game.newCells}
          phase={game.phase}
          spinKey={game.spinKey}
        />
      ))}
    </div>
  );
}