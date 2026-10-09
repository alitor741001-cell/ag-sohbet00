import React, { useEffect, useRef } from 'react';
import ZarDie from './ZarDie';
import { DICE_TEAMS, sumTone } from './zarConfig';

/** Referans tasarımdaki "YENİ" paneli: atılan her zar geçmişe eklenir ve akış aşağı doğru iner. */
export default function ZarHistory({ entries }) {
  const listRef = useRef(null);
  const rows = Array.isArray(entries) ? entries : [];

  // Yeni tur geldiğinde akış aşağı kayar: en son atılan zarlar her zaman görünür.
  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [rows.length, rows[0]?.round_no]);

  return (
    <aside className="zar-history" aria-label="Son atılan zarlar">
      <p className="zar-history-head">
        YENİ
        <span className="zar-history-count">{rows.length}</span>
      </p>
      <div ref={listRef} className="zar-history-list">
        {[...rows].reverse().map((entry) => (
          <span key={entry.round_no} className={`zar-history-row zar-history-row-${sumTone(entry.sum)}`}>
            <span className="zar-history-pair">
              {DICE_TEAMS.map((team, index) => (
                <ZarDie key={team} value={entry[`d${index + 1}`] || 1} team={team} size="mini" />
              ))}
            </span>
            <span className="zar-history-sum">{entry.sum}</span>
          </span>
        ))}
      </div>
      {!rows.length && <p className="zar-history-empty">Bekleniyor</p>}
    </aside>
  );
}