import React from 'react';
import ZarCupDie from '@/components/games/zar/ZarCupDie';
import { DICE_TEAMS } from './zarConfig';

/** Parlak siyah plastik kase: kalın gövde ve üstünde şeffaf cam kubbe. Zarlar kase
    içinde çuhada durur; çalkalanırken camdan görünür, kase kalkınca tek tek açılırlar. */
export default function ZarShaker({ dice, phase }) {
  const shaking = phase === 'shaking';
  const revealed = shaking && Array.isArray(dice);
  const values = revealed ? dice : [1, 1, 1];

  return (
    <div className={`zar-shaker${shaking ? ' zar-shaker-live' : ''}${revealed ? ' zar-shaker-open' : ''}`}>
      <span aria-hidden="true" className="zar-cup">
        <span className="zar-cup-rim" />
      </span>
      <span className="zar-cup-dice">
        {values.map((value, index) => (
          <ZarCupDie key={index} value={value} team={DICE_TEAMS[index]} />
        ))}
      </span>
      <span aria-hidden="true" className="zar-cup-glass" />
      <span aria-hidden="true" className="zar-cup-shadow" />
    </div>
  );
}