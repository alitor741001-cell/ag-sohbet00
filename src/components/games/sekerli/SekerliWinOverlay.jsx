import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
import { formatMult } from '@/components/games/sekerli/sekerliConfig';
export default function SekerliWinOverlay({ multiplier, ...props }) {
  return <GameWinArtwork game="sekerli" {...props} detail={multiplier > 0 ? `${formatMult(multiplier)} · ${props.title || 'KAZANÇ'}` : undefined} />;
}