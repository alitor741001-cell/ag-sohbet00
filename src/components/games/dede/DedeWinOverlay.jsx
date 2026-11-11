import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Zap } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';
import { DEDE_HEADER_ART } from './DedeZeusHeader';
import { formatCoins } from './dedeConfig';
import './dedeWinCard.css';

/** Dede'ye özel kazanç kartı: Zeus madalyonu, şimşekler ve altın tutar. */
export default function DedeWinOverlay({ open, amount, title = 'ZEUS ÖDÜLÜ', subtitle = 'KAZANDINIZ', action = 'TOPLA', onAccept }) {
  const button = useRef(null);
  useBackDismiss(open, onAccept);
  useEffect(() => { if (open) button.current?.focus({ preventScroll: true }); }, [open]);
  if (!open) return null;
  const turns = title.includes('HAKKI');
  return createPortal(
    <div className="dwc" role="dialog" aria-modal="true" aria-label={title}>
      <span className="dwc-glow" aria-hidden="true" />
      {[0, 1, 2, 3].map((index) => <Zap key={index} className={`dwc-bolt dwc-bolt-${index}`} aria-hidden="true" />)}
      <div className="dwc-card">
        <span className="dwc-medal" style={{ backgroundImage: `url(${DEDE_HEADER_ART})` }} aria-hidden="true" />
        <p className="dwc-title">{title}</p>
        <p className="dwc-sub">{subtitle}</p>
        <output className="dwc-amount tabular-nums">{formatCoins(amount)}{turns ? ' TUR' : ''}</output>
        <button ref={button} type="button" onClick={onAccept} className="dwc-btn">{action}</button>
      </div>
    </div>,
    document.body,
  );
}