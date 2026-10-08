import React from 'react';
import { formatCredits } from './sekerliConfig';
import useCountUp from './useCountUp';

/** Bedava çevrim paneli: kalan tur sayısı ve biriken bonus kazancı. */
export default function SekerliFreeSpinPanel({ left, total }) {
  const shown = useCountUp(total, 520);

  return (
    <div className="sl-fs">
      <p className="sl-fs-title">KALAN FREESPİNLER</p>
      <p key={left} className="sl-fs-count">{left}</p>
      <p className="sl-fs-sub">BONUS KAZANCI</p>
      <p className="sl-fs-total">{formatCredits(shown)}</p>
    </div>
  );
}