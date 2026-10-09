import React from 'react';
import ZarDie from './ZarDie';

/** Referans tasarımdaki "YENİ" paneli: son turların atılan zarları alt alta durur. */
export default function ZarHistory({ entries }) {
  const rows = Array.isArray(entries) ? entries.slice(0, 6) : [];

  return (
    <aside className="zar-history" aria-label="Son atılan zarlar">
      <p className="zar-history-head">
        YENİ
        <span className="zar-history-count">{Array.isArray(entries) ? entries.length : 0}</span>
      </p>
      <div className="zar-history-list">
        {rows.map((entry) => (
          <span key={entry.round_no} className="zar-history-row">
            <ZarDie value={entry.d1 || 1} size="mini" />
            <ZarDie value={entry.d2 || 1} size="mini" />
            <ZarDie value={entry.d3 || 1} size="mini" />
          </span>
        ))}
      </div>
      {!rows.length && <p className="zar-history-empty">Bekleniyor</p>}
    </aside>
  );
}