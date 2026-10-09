import React from 'react';
import ZarDie from './ZarDie';
import { DICE_TEAMS, sumTone } from './zarConfig';

const ROWS = 5;

/** Referans tasarımdaki "YENİ" paneli: son turlarda çıkan zarlar takım renkleriyle alt alta durur. */
export default function ZarHistory({ entries }) {
  const rows = Array.isArray(entries) ? entries.slice(0, ROWS) : [];

  return (
    <aside className="zar-history" aria-label="Son atılan zarlar">
      <p className="zar-history-head">
        YENİ
        <span className="zar-history-count">{Array.isArray(entries) ? entries.length : 0}</span>
      </p>
      <div className="zar-history-list">
        {rows.map((entry) => (
          <span key={entry.round_no} className={`zar-history-row zar-history-row-${sumTone(entry.sum)}`}>
            {DICE_TEAMS.map((team, index) => (
              <ZarDie key={team} value={entry[`d${index + 1}`] || 1} team={team} size="mini" />
            ))}
          </span>
        ))}
      </div>
      {!rows.length && <p className="zar-history-empty">Bekleniyor</p>}
    </aside>
  );
}