import React from 'react';
import { ChevronRight } from 'lucide-react';
import { pocketTone } from './rouletteConfig';

/** "NEW >" kartı: son iki çıkan numara, en yenisi büyük. */
export default function RouletteHistory({ entries }) {
  const last = (entries || []).slice(0, 2).reverse();
  return (
    <div className="rl2-new" aria-label="Son çıkan numaralar">
      <span className="rl2-new-title">NEW <ChevronRight className="h-3.5 w-3.5" /></span>
      <span className="rl2-new-row">
        <span className="rl2-new-dots">•••</span>
        {last.map((entry, i) => (
          <span
            key={entry.round_no}
            className={`rl2-new-pocket rl2-new-${pocketTone(entry.number)} ${i === last.length - 1 ? 'rl2-new-latest' : ''}`}
          >
            {entry.number}
          </span>
        ))}
      </span>
    </div>
  );
}