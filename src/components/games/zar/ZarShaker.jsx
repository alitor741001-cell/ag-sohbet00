import React from 'react';
import ZarDie from './ZarDie';
import { DICE_TEAMS } from './zarConfig';

/** Kara kase: çalkalanırken kapalıdır ve zarlar içinde görünmez,
    son iki saniyede kase yukarı kayar ve zarlar çuhada açılır. */
export default function ZarShaker({ dice, phase }) {
  const shaking = phase === 'shaking';
  const revealed = shaking && Array.isArray(dice);
  const values = revealed ? dice : [1, 1, 1];

  return (
    <div className={`zar-shaker${shaking ? ' zar-shaker-live' : ''}${revealed ? ' zar-shaker-open' : ''}`}>
      <span aria-hidden="true" className="zar-cup">
        <span className="zar-cup-shine" />
        <span className="zar-cup-rim" />
      </span>
      <span className="zar-cup-dice">
        {values.map((value, index) => (
          <ZarDie key={index} value={value} team={DICE_TEAMS[index]} size="md" />
        ))}
      </span>
      <span aria-hidden="true" className="zar-cup-shadow" />
    </div>
  );
}