import React from 'react';

/**
 * Biriken çarpan çemberi: alta sabit durur. İnen her küre değeri yukarıdan çemberin
 * içine düşer, oradaki birikmiş çarpanla birleşir ve yeni toplam çemberde kalır.
 */
export default function DedeMultiplierCircle({ multiplier, orbs }) {
  const landed = orbs || [];
  const total = multiplier > 0 ? multiplier : 1;

  return (
    <div className="dede-mult-circle" data-active={total > 1 ? 'on' : 'off'}>
      {/* Çarpan her büyüdüğünde çember dışa doğru bir şok halkası salar. */}
      {total > 1 && <span key={`pop-${total}`} aria-hidden="true" className="dede-mult-pop" />}
      <span key={`value-${total}`} className="dede-mult-circle-value dede-mult-value-pop">
        ×{total}
      </span>
      {/* İnen küre jetonları sırayla çemberin içine düşer. */}
      {landed.map((orb, index) => (
        <span
          key={`${total}-${orb.reel}-${orb.row}-${orb.value}-${index}`}
          aria-hidden="true"
          className="dede-mult-chip"
        >
          <span className="dede-mult-chip-inner" style={{ animationDelay: `${index * 70}ms` }}>
            +{orb.value}x
          </span>
        </span>
      ))}
    </div>
  );
}