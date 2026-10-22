import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatMult } from '../rocket/rocketConfig';

// Çarpana göre renk: mavi < 2x, yeşil 2-5x, turuncu 5-10x, kırmızı 10x+.
const tone = (m) => (m >= 10 ? 'av-pill-red' : m >= 5 ? 'av-pill-orange' : m >= 2 ? 'av-pill-green' : 'av-pill-blue');

/** Üstte en son 5 sonuç görünür. Kare ikonuna basınca kalan tüm sonuçlar
 *  (toplam 20'ye kadar) açılır kapanır panel olarak listelenir.
 *  Sunucu geçmişinden gelir — oyunu kapatıp açsan da aynı kalır, herkes ortak görür. */
const VISIBLE = 5;
const MAX = 20;

export default function AviatorHistory({ history }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const items = [...(history || [])].reverse().slice(0, MAX);
  const firstKey = items[0]?.round_no;

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = 0;
  }, [firstKey]);

  const visible = items.slice(0, VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <div className="px-2 pb-2">
      <div ref={ref} className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {visible.map((h) => (
          <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="av-pill av-pill-more flex items-center gap-1 cursor-pointer transition-colors hover:bg-slate-700/60"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-slate-400" />
            {hiddenCount}
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>
      {open && hiddenCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/70 p-2">
          {items.slice(VISIBLE).map((h) => (
            <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
          ))}
        </div>
      )}
    </div>
  );
}