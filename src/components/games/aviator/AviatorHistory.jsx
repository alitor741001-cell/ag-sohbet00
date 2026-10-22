import React from 'react';
import { formatMult } from '../rocket/rocketConfig';

const tone = (m) => (m >= 10 ? 'av-pill-red' : m >= 2 ? 'av-pill-violet' : 'av-pill-blue');

/** Son turların çarpanları: yatay kayan renkli haplar. */
export default function AviatorHistory({ history }) {
  const items = [...(history || [])].reverse().slice(0, 20);
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
      {items.map((h) => (
        <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
      ))}
    </div>
  );
}