import React from 'react';
import { ChevronRight } from 'lucide-react';
import { pocketTone } from './rouletteConfig';

// NEW kartında en fazla bu kadar açılmış numara durur; yenisi gelince en eski düşer.
const NEW_LIMIT = 15;

/** "NEW >" kartı: son 15 numara, en yenisi başta. */
export default function RouletteHistory({ entries }) {
  const list = (entries || []).slice(0, NEW_LIMIT);
  return (
    <div className="rl2-new" aria-label="Son çıkan numaralar">
      <span className="rl2-new-title">NEW <ChevronRight className="h-3.5 w-3.5" /></span>
      <span className="rl2-new-grid">
        {list.map((entry, i) => (
          <span
            key={entry.round_no}
            className={`rl2-new-pocket rl2-new-${pocketTone(entry.number)} ${i === 0 ? 'rl2-new-latest' : ''}`}
          >
            {entry.number}
          </span>
        ))}
      </span>
    </div>
  );
}