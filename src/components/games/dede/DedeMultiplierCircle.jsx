import React from 'react';

/**
 * Biriken çarpan çemberi: panelin sağ alt köşesinde sabit durur. İnen her küre,
 * ızgaradaki yerine göre sıraya girer ve çemberin solunda kendi yerinde listelenir;
 * patlayan küreler de aynı sırada kalır, üst üste binmez.
 */
export default function DedeMultiplierCircle({ multiplier, orbs }) {
  const landed = [...(orbs || [])].sort((a, b) => (a.reel - b.reel) || (a.row - b.row));
  const total = multiplier > 0 ? multiplier : 1;

  return (
    <div className="dede-mult-wrap">
      {/* İnen ve patlayan küreler indikleri sırayla burada durur. */}
      {landed.length > 0 && (
        <span className="dede-mult-list" aria-hidden="true">
          {landed.map((orb, index) => (
            <span
              key={`${orb.reel}-${orb.row}-${orb.value}`}
              className="dede-mult-chip"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              +{orb.value}x
            </span>
          ))}
        </span>
      )}
      <div className="dede-mult-circle" data-active={total > 1 ? 'on' : 'off'}>
        {/* Çarpan her büyüdüğünde çember dışa doğru bir şok halkası salar. */}
        {total > 1 && <span key={`pop-${total}`} aria-hidden="true" className="dede-mult-pop" />}
        <span key={`value-${total}`} className="dede-mult-circle-value dede-mult-value-pop">
          ×{total}
        </span>
      </div>
    </div>
  );
}