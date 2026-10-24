import React from 'react';

/** Koltuk renk paleti: her koltuk kendi neon rengini taşır. */
export const SEAT_NEON = ['#ff3b5c', '#ff9f1c', '#ffe03b', '#3bff8a', '#2ee6ff', '#3b7bff', '#a63bff', '#ff3bd4'];
export const seatNeon = (variant = 0) => SEAT_NEON[Math.abs(variant) % SEAT_NEON.length];

/** Koltuk dairesi: renkli neon dış çember, tam çember profil alanı. */
export default function VoiceSeatRing({ children, className = '', variant = 0 }) {
  const c = seatNeon(variant);
  return (
    <span className={`relative block shrink-0 rounded-full ${className}`}>
      <span
        className="relative block h-full w-full overflow-hidden rounded-full bg-[#08101d]"
        style={{ boxShadow: `0 0 0 2.5px ${c}, 0 0 10px 1px ${c}, 0 0 20px ${c}80, inset 0 0 10px ${c}55` }}
      >
        {children}
      </span>
    </span>
  );
}