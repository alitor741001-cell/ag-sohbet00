import React from 'react';
import { History } from 'lucide-react';
import { colorForMult, formatMult, MULT_PILL_CLASS } from '../rocket/rocketConfig';

/** Otobüs roket sağ paneli: son turların çakılma çarpanları dikey akar. */
export default function OtobusHistorySide({ history, onOpen }) {
  const rows = (history || []).slice(0, 14);

  return (
    <aside className="absolute bottom-2 right-2 top-2 z-10 flex w-[26%] max-w-[7rem] flex-col overflow-hidden rounded-xl border border-[#2f5140]/60 bg-[#0a1711]/85 backdrop-blur-sm">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 py-1.5">
        {rows.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-[#7f9a8b]">SONUÇ BEKLENİYOR</p>
        )}
        {rows.map((row) => (
          <span
            key={row.round_no}
            className={`flex-0 mb-1 inline-flex items-center justify-center rounded-lg border px-1 py-1.5 text-center text-[10px] font-black ${MULT_PILL_CLASS[colorForMult(row.crash_at)]}`}
          >
            {formatMult(row.crash_at)}
          </span>
        ))}
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Tüm sonuçlar"
          className="flex shrink-0 items-center justify-center gap-1 border-t border-[#2f5140]/40 py-1.5 text-[9px] font-black tracking-[0.08em] text-[#ffe9a8]"
        >
          <History className="h-3.5 w-3.5" />
          TÜMÜ
        </button>
      )}
    </aside>
  );
}