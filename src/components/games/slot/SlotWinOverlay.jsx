import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
export default function SlotWinOverlay({ jackpot, winner, ...props }) {
  return <GameWinArtwork {...props} detail={[jackpot && 'JACKPOT', winner && `Kazanan: ${winner}`].filter(Boolean).join(' · ')} />;
}