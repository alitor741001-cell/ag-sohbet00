import React from 'react';
import DedeWings from './DedeWings';

/** Çarpan değerinin rengi: küçük değerler yeşil, orta değerler mor, büyük değerler altın. */
const orbTier = (value) => {
  if (value >= 100) return 'gold';
  if (value >= 10) return 'mid';
  return 'small';
};

/** Çarpan küresi: kanatlı altın madalyon, içinde çarpan değeri. */
export default function DedeOrb({ value }) {
  return (
    <span className={`dede-orb dede-orb-${orbTier(value)}`}>
      <DedeWings />
      <span className="dede-orb-face">{value}x</span>
    </span>
  );
}