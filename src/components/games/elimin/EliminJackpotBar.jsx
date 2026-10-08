import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { CHEST_MAX, JACKPOT_PER_CHEST, formatCoins } from './eliminConfig';

// Sandık: jackpot şeridinin önünde duran altın kasa.
function Chest() {
  return (
    <svg viewBox="0 0 64 64" className="el-chest" aria-hidden="true">
      <path d="M6 28 h52 v26 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4z" fill="#c07a1a" stroke="#6b3c02" strokeWidth="3" />
      <path d="M6 28 a26 14 0 0 1 52 0z" fill="#f0b13c" stroke="#6b3c02" strokeWidth="3" />
      <rect x="26" y="30" width="12" height="14" rx="3" fill="#ffd75c" stroke="#6b3c02" strokeWidth="3" />
      <rect x="6" y="34" width="52" height="5" fill="#e0912a" stroke="#6b3c02" strokeWidth="2" />
    </svg>
  );
}

/**
 * Üst şeridin orta-sağ bloğu: ortada jackpot yazısı ve tutar, sağda sandık kutusu ve oyuncu rozeti.
 * Sandık kutusu bar dolduğunda basılabilir: biriken tutar bakiyeye eklenir, bar sıfırlanır.
 */
export default function EliminJackpotBar({ jackpot, chests = 0, bet, busy, onCollect }) {
  const { user } = useCurrentUser();
  const avatar = user?.avatar_url || user?.avatar || '';
  const initials = (user?.full_name || '?').trim().slice(0, 1).toUpperCase();
  const filled = Math.min(CHEST_MAX, Math.max(0, chests || 0));
  const full = filled >= CHEST_MAX;

  return (
    <section className="el-jackpot">
      <div className="el-jackpot-main">
        <p className="el-jackpot-label">JACKPOT</p>
        <p className="el-jackpot-value">{formatCoins(jackpot)}</p>
      </div>

      <div className="el-jackpot-side">
        <button
          type="button"
          onClick={onCollect}
          disabled={!full || busy}
          aria-label="Sandığı topla"
          className={`el-chest-box ${full ? 'el-chest-box-full' : ''}`}
        >
          <Chest />
          <span className="el-chest-bar">
            <span className="el-chest-fill" style={{ width: `${(filled / CHEST_MAX) * 100}%` }} />
          </span>
          <span className="el-chest-text">{filled}/{CHEST_MAX} SANDIK</span>
          {/* Bar dolduysa toplanacak tutar, dolmadıysa sandığın eklediği değer yazar. */}
          {full
            ? <span className="el-chest-claim">TOPLA {formatCoins(jackpot)}</span>
            : <span className="el-chest-gain">+{formatCoins((bet || 0) * JACKPOT_PER_CHEST)}</span>}
        </button>

        <span className="el-avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" className="el-avatar-img" /> : initials}
        </span>
      </div>
    </section>
  );
}