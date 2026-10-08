import React from 'react';
import { Coins, Play } from 'lucide-react';
import { LINES, formatCoins } from './eliminConfig';
import GameBetBar from '../controls/GameBetBar';
import GameSpinButton from '../controls/GameSpinButton';

/** Alt konsol: WIN, bakiye ve Şekerli Meyve'yle aynı bahis kademesi ile tur madalyonu. */
export default function EliminFooter({
  win,
  coins,
  totalWon,
  bet,
  spinning,
  ready,
  auto,
  onStep,
  onMax,
  onAuto,
  onSpin,
  onStop,
}) {
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

      <div className="gctl-deck">
        <GameBetBar
          bet={bet}
          lines={LINES}
          disabled={spinning}
          onStep={onStep}
          onMax={onMax}
          format={formatCoins}
        />
        <GameSpinButton
          spinning={spinning}
          disabled={!ready}
          auto={auto}
          icon={Play}
          onSpin={onSpin}
          onStop={onStop}
          onAuto={onAuto}
        />
      </div>
    </footer>
  );
}