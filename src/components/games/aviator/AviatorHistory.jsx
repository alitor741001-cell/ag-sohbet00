import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { formatMult } from '../rocket/rocketConfig';

// Çarpana göre renk: mavi < 2x, yeşil 2-5x, turuncu 5-10x, kırmızı 10x+.
const tone = (m) => (m >= 10 ? 'av-pill-red' : m >= 5 ? 'av-pill-orange' : m >= 2 ? 'av-pill-green' : 'av-pill-blue');

/** Üstte en son 5 sonuç görünür. Kare ikonuna basınca küçük ayrı bir pencere
 *  açılır ve kalan tüm sonuçları (toplam 20'ye kadar) grid olarak gösterir.
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
    <div className="relative px-2 pb-2">
      <div ref={ref} className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {visible.map((h) => (
          <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="av-pill av-pill-more flex items-center gap-1 cursor-pointer transition-colors hover:bg-slate-700/60"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-slate-400" />
            {hiddenCount}
          </button>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute right-2 top-full z-[100] mt-1 w-56 rounded-lg border border-slate-700/70 bg-slate-900/95 p-3 shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Geçmiş Sonuçlar</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(VISIBLE).map((h) => (
                <span key={h.round_no} className={`av-pill ${tone(h.crash_at)}`}>{formatMult(h.crash_at)}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}