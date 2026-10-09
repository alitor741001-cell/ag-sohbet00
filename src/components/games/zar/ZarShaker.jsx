import React from 'react';
import ZarDie from './ZarDie';

/** Kara kase: kapalıyken zarlar kase içinde durur, çalkalanırken kase içinde döner,
    açılınca kase yukarı kayar ve zarlar çuhada kalır. */
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
          <ZarDie key={index} value={value} size="md" rattle={shaking} dim={!revealed} />
        ))}
      </span>
      <span aria-hidden="true" className="zar-cup-shadow" />
    </div>
  );
}