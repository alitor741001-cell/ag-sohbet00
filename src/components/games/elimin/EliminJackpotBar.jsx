import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { CHEST_MAX, DICE_MIN, JACKPOT_PER_CHEST, formatCoins } from './eliminConfig';

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
 * Jackpot şeridi: barda biriken sandıklar ve bahis kademesine göre yükselen
 * jackpot tutarı, zar kuralı ve oyuncunun rozeti.
 */
export default function EliminJackpotBar({ jackpot, chests = 0, bet }) {
  const { user } = useCurrentUser();
  const avatar = user?.avatar_url || user?.avatar || '';
  const initials = (user?.full_name || '?').trim().slice(0, 1).toUpperCase();
  const filled = Math.min(CHEST_MAX, Math.max(0, chests || 0));

  return (
    <section className="el-jackpot">
      <div className="el-jackpot-main">
        <p className="el-jackpot-label">JACKPOT</p>
        <p className="el-jackpot-value">{formatCoins(jackpot)}</p>
        <p className="el-jackpot-hint">{DICE_MIN} ZAR → YARISI SENİN</p>
      </div>

      <div className="el-jackpot-chest">
        <Chest />
        <span className="el-chest-bar">
          <span className="el-chest-fill" style={{ width: `${(filled / CHEST_MAX) * 100}%` }} />
        </span>
        <span className="el-chest-text">{filled}/{CHEST_MAX} SANDIK</span>
        {/* Her sandığın eklediği değer: bahis kademesiyle birlikte yükselir. */}
        <span className="el-chest-gain">+{formatCoins((bet || 0) * JACKPOT_PER_CHEST)}</span>
      </div>

      <span className="el-avatar" aria-hidden="true">
        {avatar ? <img src={avatar} alt="" className="el-avatar-img" /> : initials}
      </span>
    </section>
  );
}