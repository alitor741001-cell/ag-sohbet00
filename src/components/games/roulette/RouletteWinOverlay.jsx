import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
import { pocketName } from '@/components/games/roulette/rouletteConfig';
export default function RouletteWinOverlay({ number, ...props }) {
  return <GameWinArtwork {...props} detail={number == null ? undefined : `${number} · ${pocketName(number)}`} />;
}