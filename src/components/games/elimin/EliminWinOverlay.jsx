import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { formatCoins } from './eliminConfig';

/** Büyük kazanç ekranı: toplam bahsin 10 katı ve üzeri kazançlarda açılır. */
export default function EliminWinOverlay({ open, amount, title = 'BÜYÜK KAZANÇ!', subtitle = '', action = 'AL', onAccept }) {
  if (!open) return null;

  return (
    <div className="el-overlay">
      <div className="el-overlay-card">
        <Trophy className="el-overlay-icon h-12 w-12" />
        <p className="el-overlay-title">{title}</p>
        {subtitle && <p className="el-overlay-sub">{subtitle}</p>}
        <p className="el-overlay-amount">
          <Sparkles className="h-6 w-6" />
          {formatCoins(amount)}
        </p>
        <button type="button" onClick={onAccept} className="el-overlay-btn">{action}</button>
      </div>
    </div>
  );
}