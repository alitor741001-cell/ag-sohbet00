import React from 'react';
import { formatCredits } from './sekerliConfig';
import useCountUp from './useCountUp';

/** Alt bilgi şeridi: kredi, bahis ve tur kazancı. */
export default function SekerliStats({ credits, bet, win, free }) {
  const shownWin = useCountUp(win, 520);
  const items = [
    { label: 'KREDİ', value: formatCredits(credits), tone: 'credit' },
    { label: 'BAHİS', value: formatCredits(bet), tone: 'bet' },
    { label: 'KAZANÇ', value: formatCredits(shownWin), tone: 'win', live: shownWin > 0 },
  ];

  return (
    <div className={`sl-stats ${free ? 'sl-stats-free' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className={`sl-stat sl-stat-${item.tone} ${item.live ? 'sl-stat-live' : ''}`}>
          <span className="sl-stat-label">{item.label}</span>
          <span className="sl-stat-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}