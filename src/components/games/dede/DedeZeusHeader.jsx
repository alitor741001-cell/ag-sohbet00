import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCoins } from './dedeConfig';
import './dedeZeusHeader.css';

export const DEDE_HEADER_ART = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/e9f29ad9b_dede-header.jpg';

/** Dede üst sahnesi: Zeus tasarımı, sol üstte coin barı, NO:1 rozetinde en çok kazanan. */
export default function DedeZeusHeader({ coins, leader, compact, onLeaders, onHelp }) {
  return (
    <header className={`dzh ${compact ? 'dzh-compact' : ''}`}>
      <img src={DEDE_HEADER_ART} alt="" className="dzh-art" draggable={false} />
      <span className="dzh-coins tabular-nums">{formatCoins(coins || 0)}</span>
      <button type="button" onClick={onLeaders} aria-label="Kazananları gör" className="dzh-badge">
        <span className="dzh-avatar">
          {leader?.avatar ? (
            <Image src={leader.avatar} alt={leader.name} className="h-full w-full" fittingType="fill" quality={70} />
          ) : (
            <span className="dzh-initial">{(leader?.name || '?').trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
      </button>
      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="dzh-help">
        <HelpCircle className="h-full w-full" strokeWidth={2.6} />
      </button>
    </header>
  );
}