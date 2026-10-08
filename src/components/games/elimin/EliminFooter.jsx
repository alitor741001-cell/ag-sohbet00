import React from 'react';
import { Coins, Minus, Plus, RotateCw, Square } from 'lucide-react';
import { LINES, formatCoins } from './eliminConfig';

/** Alt konsol: WIN, bakiye, bahis kademesi, AUTO ve büyük SPIN düğmesi. */
export default function EliminFooter({ win, coins, totalWon, bet, spinning, ready, auto, onStep, onAuto, onSpin, onStop }) {
  return (
    <footer className="el-foot">
      <div className={`el-win-row ${win > 0 ? 'el-win-row-on' : ''}`}>
        <span className="el-win-label">WIN</span>
        <span className={`el-win-value ${win > 0 ? 'el-win-value-on' : ''}`}>{formatCoins(win)}</span>
      </div>

      <div className="el-balance-row">
        <span className="el-balance-row-item"><Coins className="h-3.5 w-3.5" /> {formatCoins(coins)}</span>
        <span className="el-balance-row-item">TOPLAM {formatCoins(totalWon)}</span>
      </div>

      <div className="el-deck">
        <div className="el-bet">
          <span className="el-bet-label">BAHİS YAP</span>
          <div className="el-stepper">
            <button type="button" onClick={() => onStep(-1)} disabled={spinning} className="el-step" aria-label="Bahsi azalt">
              <Minus className="h-4 w-4" />
            </button>
            <span className="el-bet-value">{formatCoins(bet)}</span>
            <button type="button" onClick={() => onStep(1)} disabled={spinning} className="el-step" aria-label="Bahsi artır">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="el-bet-total">TOPLAM BAHİS {formatCoins(bet * LINES)}</span>
        </div>

        <button
          type="button"
          onClick={onAuto}
          aria-pressed={auto}
          className={`el-auto ${auto ? 'el-auto-on' : ''}`}
        >
          AUTO
        </button>

        <button
          type="button"
          onClick={spinning ? onStop : onSpin}
          disabled={!ready && !spinning}
          aria-label={spinning ? 'Turu durdur' : 'Turu çevir'}
          className="el-spin"
        >
          {spinning ? <Square className="h-5 w-5" /> : <RotateCw className="h-6 w-6" />}
          <span>{spinning ? 'DUR' : 'SPIN'}</span>
        </button>
      </div>
    </footer>
  );
}