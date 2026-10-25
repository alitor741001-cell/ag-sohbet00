import React, { useEffect, useRef, useState } from 'react';
import GameWinArtwork from '@/components/games/shared/GameWinArtwork';

export default function RocketWinOverlay({ game }) {
  const [prize, setPrize] = useState(null);
  const seen = useRef(new Set());
  const initialized = useRef(false);
  useEffect(() => {
    if (game.status !== 'ready' || !game.me || !game.round) return;
    const key = game.round.round_no;
    if (!initialized.current) {
      initialized.current = true;
      if (game.phase === 'crashed') seen.current.add(key);
    }
    if (game.phase !== 'crashed' || seen.current.has(key)) return;
    const rows = game.bets.filter(bet => bet.user_id === game.me);
    if (rows.some(bet => bet.status === 'active')) return;
    const amount = rows.filter(bet => bet.status === 'cashed').reduce((total, bet) => total + (bet.payout || 0), 0);
    seen.current.add(key);
    if (amount > 0) setPrize({ amount });
  }, [game.status, game.me, game.round, game.phase, game.bets]);
  return <GameWinArtwork open={!!prize} amount={prize?.amount || 0} onAccept={() => setPrize(null)} />;
}