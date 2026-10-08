import React from 'react';
import { ChevronLeft, Coins, HelpCircle, Volume2, VolumeX, X } from 'lucide-react';
import { formatCoins } from './eliminConfig';

/** Üst şerit: bakiye sekmesi, kurallar, ses ve kapatma. */
export default function EliminTopBar({ coins, sound, onSound, onCoins, onHelp, onBack, onExit }) {
  return (
    <header className="el-head">
      <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="el-icon">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button type="button" onClick={onCoins} className="el-balance" aria-label="Coin yükle">
        <span className="el-balance-coin"><Coins className="h-3.5 w-3.5" /></span>
        <span>{formatCoins(coins)}</span>
      </button>

      <div className="min-w-0 flex-1" />

      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="el-icon">
        <HelpCircle className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onSound}
        aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
        className={`el-icon ${sound ? 'el-icon-on' : ''}`}
      >
        {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="el-icon el-icon-close">
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}