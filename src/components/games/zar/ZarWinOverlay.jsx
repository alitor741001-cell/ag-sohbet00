import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
import { outcomeName } from '@/components/games/zar/zarConfig';
export default function ZarWinOverlay({ dice, sum, outcome, ...props }) {
  return <GameWinArtwork game="zar" {...props} detail={`${(dice || []).join(' + ')} = ${sum || 0} · ${outcomeName(outcome)}`} />;
}