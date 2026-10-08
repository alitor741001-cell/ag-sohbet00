import React from 'react';
import { formatCredits, formatMult } from './sekerliConfig';
import useCountUp from './useCountUp';

/** Büyük kazanç / bonus bitişi ekranı: çarpan ve sayaç animasyonuyla. */
export default function SekerliWinOverlay({ open, title, subtitle, amount, multiplier, tone, action = 'KABUL ET', onAccept }) {
  const shown = useCountUp(open ? amount : 0, 1200);
  if (!open) return null;

  return (
    <div className="sl-overlay" role="dialog" aria-modal="true">
      <span className="sl-overlay-rays" aria-hidden="true" />
      <div className="sl-overlay-card" style={{ '--sl-tier': tone || '#ffd21f' }}>
        <p className="sl-overlay-title">{title}</p>
        {multiplier > 0 && <p className="sl-overlay-mult">{formatMult(multiplier)}</p>}
        <p className="sl-overlay-amount">{formatCredits(shown)}</p>
        {subtitle && <p className="sl-overlay-sub">{subtitle}</p>}
        <button type="button" onClick={onAccept} className="sl-overlay-btn">{action}</button>
      </div>
    </div>
  );
}