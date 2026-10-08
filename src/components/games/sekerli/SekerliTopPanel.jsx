import React from 'react';
import { formatCredits, formatMult } from './sekerliConfig';
import useCountUp from './useCountUp';

/** Üst panel: takla zincirinden gelen bonus kazancı ve aktif çarpan. */
export default function SekerliTopPanel({ win, multiplier, active }) {
  const shown = useCountUp(win, 420);

  return (
    <div className={`sl-top ${active ? 'sl-top-live' : ''}`}>
      <span className="sl-top-glow" aria-hidden="true" />
      <p className="sl-top-label">TAKLA KAZANCI</p>
      <p className="sl-top-row">
        <span className="sl-top-value">{formatCredits(shown)}</span>
        {multiplier > 1 && (
          <span key={multiplier} className="sl-mult-chip">{formatMult(multiplier)}</span>
        )}
      </p>
    </div>
  );
}