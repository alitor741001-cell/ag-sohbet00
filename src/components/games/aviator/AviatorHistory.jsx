import React, { useEffect, useRef } from 'react';
import { formatMult } from '../rocket/rocketConfig';

// Çarpana göre renk: mavi < 2x, yeşil 2-5x, turuncu 5-10x, kırmızı 10x+.
const tone = (m) => (m >= 10 ? 'av-pill-red' : m >= 5 ? 'av-pill-orange' : m >= 2 ? 'av-pill-green' : 'av-pill-blue');

/** Son turların çarpanları: yatay kayan renkli haplar. Yeni sonuç solda kalır,
 *  eskiler sağa kayar. En fazla 7 hap görünür; fazlası için kare ikonu gösterilir.
 *  Sunucu geçmişinden gelir, oyunu kapatıp açsan da aynı kalır (herkes ortak). */
const VISIBLE = 7;
const MAX = 20;

export default function AviatorHistory({ history }) {
  const ref = useRef(null);
  const items = [...(history || [])].reverse().slice(0, MAX);
  const firstKey = items[0]?.round_no;

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0;
  }, [firstKey]);

  const visible = items.slice(0, VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <div ref={ref} className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
      {visible.map((h) => (
        <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
      ))}
      {hiddenCount > 0 && (
        <span className="av-pill av-pill-more flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-slate-400" />
          {hiddenCount}
        </span>
      )}
    </div>
  );
}