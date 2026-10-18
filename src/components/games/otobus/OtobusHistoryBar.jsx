import React from 'react';
import { History } from 'lucide-react';
import { colorForMult, formatMult, MULT_PILL_CLASS } from '../rocket/rocketConfig';

/** Son turların çakılma çarpanları solda akar; sağdaki düğme tüm sonuçları açar. */
export default function OtobusHistoryBar({ history, onOpen }) {
  const rows = (history || []).slice(0, 14);

  return (
    <div className="ob-history">
      <div className="ob-history-scroll no-scrollbar">
        {rows.length === 0 && <span className="ob-history-empty">SONUÇ BEKLENİYOR</span>}
        {rows.map((row) => (
          <span key={row.round_no} className={`ob-mult-chip ${MULT_PILL_CLASS[colorForMult(row.crash_at)]}`}>
            {formatMult(row.crash_at)}
          </span>
        ))}
      </div>
      <button type="button" onClick={onOpen} aria-label="Genel sonuçlar" className="ob-history-btn">
        <History className="h-4 w-4" />
      </button>
    </div>
  );
}