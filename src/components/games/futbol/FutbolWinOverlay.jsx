import React from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';
import { TEAM_MAP, formatCoins } from '@/components/games/futbol/futbolConfig';
export default function FutbolWinOverlay({ winner, stake, ...props }) {
  const team = TEAM_MAP[winner];
  const bet = team?.x > 0 ? Math.round((props.amount || 0) / team.x) : stake || 0;
  return <GameWinArtwork game="futbol" {...props} detail={`${team?.name || 'Kazanan takım'} · ${formatCoins(bet)} × ${team?.x || 0} = ${formatCoins(props.amount)}`} />;
}