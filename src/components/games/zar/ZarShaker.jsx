import React from 'react';
import ZarCupDie from '@/components/games/zar/ZarCupDie';
import { DICE_TEAMS } from './zarConfig';

/** Parlak siyah plastik kase: kalın gövde ve üstünde şeffaf cam kubbe. Zarlar kase
    kapalıyken görünmez; kase hızlı ve dairesel çalkalanır, sonra dikey olarak
    hızla kalkar ve zarlar çuhada tek tek açılır. */
export default function ZarShaker({ dice, phase, revealed }) {
  const shaking = phase === 'shaking' && !revealed;
  const opened = phase === 'shaking' && revealed;
  const values = opened && Array.isArray(dice) ? dice : [1, 1, 1];

  return (
    <div className={`zar-shaker${shaking ? ' zar-shaker-live' : ''}${opened ? ' zar-shaker-open' : ''}`}>
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