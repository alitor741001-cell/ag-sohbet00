import React from 'react';
import { HelpCircle } from 'lucide-react';
import './slotFrenzy.css';

/** Slot üst sahnesi: mor kadife perdeler, kemerli "FRENZY JACKPOT" başlığı ve kazanan panosu. */
export default function SlotFrenzyHeader({ onHelp, children, compact = false }) {
  return (
    <div className={`sfz relative shrink-0 pt-[env(safe-area-inset-top)]${compact ? ' sfz-compact' : ''}`}>
      <span aria-hidden="true" className="sfz-curtain sfz-curtain-l" />
      <span aria-hidden="true" className="sfz-curtain sfz-curtain-r" />
      <div className="sfz-arch">
        <p className="sfz-title"><span>FRENZY</span><span>JACKPOT</span></p>
      </div>
      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="sfz-orb sfz-orb-l">
        <HelpCircle className="h-5 w-5" strokeWidth={3} />
      </button>
      <div className="sfz-board">{children}</div>
    </div>
  );
}