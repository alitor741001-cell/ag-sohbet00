import React from 'react';
import { Image } from '@/components/ui/image';
import AnkaReels from '@/components/games/anka/AnkaReels';
import { ANKA_ART, formatCoins, ANKA_LINES } from '@/components/games/anka/ankaConfig';
export default function AnkaCabinet({ game, onBonus, onHelp }) {
  const stake = game.bet * ANKA_LINES;
  const prizes = game.jackpots || { GRAND: stake * 1000, MAJOR: stake * 150, MINOR: stake * 50, MINI: stake * 25 };
  return <div className="anka-cabinet">
    <Image src={ANKA_ART} alt="Anka Kuşu, lavlarla çevrili üç makaralı oyun" fittingType="fill" className="anka-backdrop" blurPlaceholder={false} />
    <AnkaReels game={game} />
    {['GRAND', 'MINOR', 'MAJOR', 'MINI'].map((name, i) => <div key={name} className={`anka-jackpot anka-jackpot-${i}`}><strong>{name}</strong><span>{formatCoins(prizes[name])}</span></div>)}
    <button className="anka-bonus-zone" disabled={game.busy || game.status !== 'ready' || game.free_spins > 0} onClick={onBonus}>BONUS<br />SATIN AL<small>{formatCoins(game.session_price)} COIN</small></button>
    <button className="anka-turn-zone" onClick={onHelp}>{game.free_spins ? <>{game.free_spins}<small>ANKA TURU</small></> : <>ANKA<small>TURLARI</small></>}</button>
    <div className="anka-win" role="status">{game.rolling ? 'ANKA UYANIYOR…' : `KAZANÇ ${formatCoins(game.win)} COIN`}</div>
  </div>;
}