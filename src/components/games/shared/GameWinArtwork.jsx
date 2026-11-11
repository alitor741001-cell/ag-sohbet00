import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useBackDismiss from '@/hooks/useBackDismiss';
import { WIN_THEMES } from '@/components/games/shared/winThemes';
import '@/components/games/shared/gameWinCard.css';

const format = value => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));

/** Dede kartıyla aynı yapı: oyunun kapağı madalyonda, oyunun renkleri ve simgeleri. */
export default function GameWinArtwork({ game = 'slot', open, amount, title, subtitle, action, onAccept, detail, art }) {
  const button = useRef(null);
  const theme = WIN_THEMES[game] || WIN_THEMES.slot;
  const Icon = theme.icon;
  const heading = title || theme.title;
  const turns = heading.includes('HAKKI') && !heading.includes('BİTTİ');
  useBackDismiss(open, onAccept);
  useEffect(() => { if (open) button.current?.focus({ preventScroll: true }); }, [open]);
  if (!open) return null;
  const style = { '--gwc-top': theme.top, '--gwc-bottom': theme.bottom, '--gwc-glow': theme.glow, '--gwc-accent': theme.accent };
  return createPortal(
    <div className="gwc font-body" style={style} role="dialog" aria-modal="true" aria-label={heading}>
      <span className="gwc-glow" aria-hidden="true" />
      {[0, 1, 2, 3].map((index) => <Icon key={index} className={`gwc-icon gwc-icon-${index}`} aria-hidden="true" />)}
      <div className="gwc-card">
        <span className="gwc-medal" style={{ backgroundImage: `url(${theme.cover})` }} aria-hidden="true" />
        <p className="gwc-title">{heading}</p>
        <p className="gwc-sub">{subtitle || 'KAZANDINIZ'}</p>
        {art && <img className="gwc-art" src={art} alt="Jackpot" />}
        <output className="gwc-amount tabular-nums">{format(amount)}{turns ? ' TUR' : ''}</output>
        {detail && <div className="gwc-detail">{detail}</div>}
        <button ref={button} type="button" onClick={onAccept} className="gwc-btn">{action || (turns ? 'BAŞLA' : 'TOPLA')}</button>
      </div>
    </div>,
    document.body,
  );
}