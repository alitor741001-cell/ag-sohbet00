import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
import { SLOT_ART } from '@/components/games/slotAssets';

export default function SlotWinOverlay({ jackpot, winner, ...props }) {
  return (
    <GameWinArtwork
      {...props}
      art={jackpot ? SLOT_ART.jackpot : undefined}
      detail={[jackpot && 'JACKPOT', winner && `Kazanan: ${winner}`].filter(Boolean).join(' · ')}
    />
  );
}