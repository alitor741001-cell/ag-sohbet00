import React from 'react';

/** Biriken çarpan şeridi: alt tarafta sabit durur, inen her küre değeri buraya düşer. */
export default function DedeMultiplierBar({ multiplier, orbs }) {
  const landed = (orbs || []).map((orb) => orb.value);

  return (
    <div className="dede-mult-bar">
      <span className="dede-mult-bar-title">BİRİKEN ÇARPAN</span>
      <span className="dede-mult-bar-orbs">
        {landed.length ? (
          landed.map((value, index) => (
            <span key={`${value}-${index}`} className="dede-mult-bar-orb">
              {value}x
            </span>
          ))
        ) : (
          <span className="dede-mult-bar-empty">İNEN KÜRELER BURADA BİRİKİR</span>
        )}
      </span>
      <span className="dede-mult-bar-total">×{multiplier > 1 ? multiplier : 1}</span>
    </div>
  );
}