import React, { useEffect, useRef } from 'react';
import { formatMult } from '../rocket/rocketConfig';

const tone = (m) => (m >= 10 ? 'av-pill-red' : m >= 2 ? 'av-pill-violet' : 'av-pill-blue');

/** Son turların çarpanları: yatay kayan renkli haplar. Yeni sonuç solda kalır,
 *  eskiler sağa kayar; tur eklendiğinde kaydırma en sola sıfırlanır. */
export default function AviatorHistory({ history }) {
  const ref = useRef(null);
  const items = [...(history || [])].reverse().slice(0, 20);
  const firstKey = items[0]?.round_no;

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0;
  }, [firstKey]);

  return (
    <div ref={ref} className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
      {items.map((h) => (
        <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
      ))}
    </div>
  );
}