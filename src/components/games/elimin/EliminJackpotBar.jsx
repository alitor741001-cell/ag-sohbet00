import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { CHEST_MAX, JACKPOT_PER_CHEST, formatCoins } from './eliminConfig';

// Sandık: panelin sağında duran altın kasa.
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
 * Üst panel (Şekerli Meyve'nin üst paneliyle aynı tasarım): ortada jackpot havuzu,
 * sağda sandık kutusu ve oyuncu rozeti. Havuz kaybedilen turlarla birikir, kazanan
 * turlarda ve jackpot patladığında azalır. Sandık kutusu bar dolduğunda basılabilir:
 * barda biriken tutar bakiyeye eklenir, bar sıfırlanır.
 */
export default function EliminJackpotBar({ jackpot, chests = 0, chestValue = 0, bet, busy, onCollect }) {
  const { user } = useCurrentUser();
  const avatar = user?.avatar_url || user?.avatar || '';
  const initials = (user?.full_name || '?').trim().slice(0, 1).toUpperCase();
  const filled = Math.min(CHEST_MAX, Math.max(0, chests || 0));
  const full = filled >= CHEST_MAX;

  return (
    <div className={`el-top ${busy ? 'el-top-live' : ''}`}>
      <span className="el-top-glow" aria-hidden="true" />

      <div className="el-top-main">
        <p className="el-top-label">JACKPOT</p>
        <p className="el-top-value">{formatCoins(jackpot)}</p>
      </div>

      <div className="el-top-side">
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
          <span className="el-chest-text">{filled}/{CHEST_MAX}</span>
          {/* Bar dolduysa toplanacak tutar, dolmadıysa sandığın eklediği değer yazar. */}
          {full
            ? <span className="el-chest-claim">TOPLA {formatCoins(chestValue)}</span>
            : <span className="el-chest-gain">+{formatCoins((bet || 0) * JACKPOT_PER_CHEST)}</span>}
        </button>

        <span className="el-avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" className="el-avatar-img" /> : initials}
        </span>
      </div>
    </div>
  );
}