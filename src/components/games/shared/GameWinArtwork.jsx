import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';
import '@/components/games/shared/gameWinArtwork.css';

const NORMAL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/8d3eaf690_IMG_0320.jpg';
const SESSION = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/4c6d32b81_IMG_0319.jpg';
const format = value => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));

export default function GameWinArtwork({ open, amount, title = 'TEBRİKLER!', subtitle, session, action, onAccept, detail }) {
  const button = useRef(null);
  const finished = session ?? title.includes('BİTTİ');
  const award = !finished && title.includes('HAKKI');
  const value = `${format(amount)}${award ? ' TUR' : ''}`;
  useBackDismiss(open, onAccept);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    button.current?.focus({ preventScroll: true });
    return () => previous?.isConnected && previous.focus?.({ preventScroll: true });
  }, [open]);
  if (!open) return null;
  return createPortal(<div className="game-win-artwork font-body" role="dialog" aria-modal="true" aria-label={finished ? '15 çevirme hakkı bitti, toplam kazanç' : title}
    onKeyDown={event => { if (event.key === 'Escape') onAccept?.(); if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); } }}>
    <div className={`game-win-artwork-frame ${finished ? 'game-win-artwork-session' : ''}`}>
      <Image src={finished ? SESSION : NORMAL} alt="" aria-hidden="true" fittingType="fit" blurPlaceholder={false} className="game-win-artwork-image" />
      {award && <span className="game-win-artwork-award-label">ÜCRETSİZ ÇEVİRME</span>}
      <output className="game-win-artwork-amount" aria-label={award ? 'Kazanılan tur' : 'Toplam coin kazancı'} style={{ fontSize: `${Math.min(finished ? 11 : 12, 98 / value.length)}cqw` }}>{value}</output>
      {(detail || (award && subtitle)) && <div className="game-win-artwork-detail">{detail || subtitle}</div>}
      <button ref={button} type="button" className="game-win-artwork-accept" onClick={onAccept} aria-label={award ? action || 'Başla' : 'Kabul et'}>
        {award ? <span className="game-win-artwork-action-label">{action || 'BAŞLA'}</span> : <span className="sr-only">KABUL ET</span>}
      </button>
    </div>
  </div>, document.body);
}