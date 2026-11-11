import React from 'react';
import { HelpCircle } from 'lucide-react';
import compactCoins from '@/lib/compactCoins';
import LeaderAvatar from '@/components/games/leaders/LeaderAvatar';
import './dedeZeusHeader.css';

export const DEDE_HEADER_ART = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/e9f29ad9b_dede-header.jpg';

/** Dede üst sahnesi: Zeus tasarımı, sol üstte coin barı, NO:1 rozetinde en çok kazanan. */
export default function DedeZeusHeader({ coins, leader, compact, onLeaders, onHelp, onCoins }) {
  return (
    <header className={`dzh ${compact ? 'dzh-compact' : ''}`}>
      <img src={DEDE_HEADER_ART} alt="" className="dzh-art" draggable={false} />
      <span className="dzh-coins tabular-nums">{compactCoins(coins)}</span>
      <button type="button" onClick={onLeaders} aria-label="Kazananları gör" className="dzh-badge" />
      <LeaderAvatar leader={leader} className="dzh-avatar" />
      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="dzh-help">
        <HelpCircle className="h-full w-full" strokeWidth={2.6} />
      </button>
    </header>
  );
}