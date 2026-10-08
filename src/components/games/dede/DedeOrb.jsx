import React from 'react';
import DedeWings from './DedeWings';

/** Çarpan küresi: kanatlı altın madalyon, içinde çarpan değeri. */
export default function DedeOrb({ value }) {
  return (
    <span className="dede-orb">
      <DedeWings />
      <span className="dede-orb-face">{value}x</span>
    </span>
  );
}