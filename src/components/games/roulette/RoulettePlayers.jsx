import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { formatCoins } from './rouletteConfig';

/** "Players" düğmesi: bu turun kazanan oyuncu listesini açar. */
export default function RoulettePlayers({ winners }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rl2-players-wrap">
      <button type="button" onClick={() => setOpen((v) => !v)} className="rl2-players">
        Players
        <span className="rl2-players-icon"><Users className="h-4 w-4" /></span>
      </button>
      {open && (
        <div className="rl2-players-list">
          {winners.length === 0 && <p>Henüz oyuncu yok</p>}
          {winners.map((w, i) => (
            <p key={`${w.user_id || i}`}>
              <span>{i + 1}. {w.user_name || 'Oyuncu'}</span>
              <b>{formatCoins(w.payout)}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}