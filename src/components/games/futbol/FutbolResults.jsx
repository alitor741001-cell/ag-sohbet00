import React from 'react';
import { TEAM_MAP } from './futbolConfig';

/** Son turların kazananları: en yeni tur başta, yatay kaydırılabilir şerit. */
export default function FutbolResults({ history }) {
  return (
    <div className="fut-results no-scrollbar" aria-label="Son tur kazananları">
      {history.length === 0 && <span className="fut-result fut-result-empty">Henüz sonuç yok</span>}
      {history.map((row, index) => (
        <span key={row.round_no} className={`fut-result ${index === 0 ? 'fut-result-new' : ''}`}>
          {index === 0 && <b className="fut-result-badge">YENİ</b>}
          {TEAM_MAP[row.winner_id]?.name || '—'}
        </span>
      ))}
    </div>
  );
}