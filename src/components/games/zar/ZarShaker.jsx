import React from 'react';
import ZarDie from './ZarDie';
import { DICE_TEAMS } from './zarConfig';

/** Kara kase: bahis aşamasında kapalı durur, çalkalanırken zarlar kase içinde döner,
    son iki saniyede kase yukarı kayar ve zarlar çuhada açılır. */
export default function ZarShaker({ dice, phase }) {
  const shaking = phase === 'shaking';
  const revealed = shaking && Array.isArray(dice);
  // Kapalıyken zarların yüzü gizlenir: sonuç yalnızca çalkalama anında açılır.
  const values = revealed ? dice : [1, 1, 1];

  return (
    <div className={`zar-shaker${shaking ? ' zar-shaker-live' : ''}${revealed ? ' zar-shaker-open' : ''}`}>
      <span aria-hidden="true" className="zar-cup">
        <span className="zar-cup-shine" />
        <span className="zar-cup-rim" />
      </span>
      <span className="zar-cup-dice">
        {values.map((value, index) => (
          <ZarDie key={index} value={value} team={DICE_TEAMS[index]} size="md" spin={shaking} dim={!revealed} />
        ))}
      </span>
      <span aria-hidden="true" className="zar-cup-shadow" />
    </div>
  );
}