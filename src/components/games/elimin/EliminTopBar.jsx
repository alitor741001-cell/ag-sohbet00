import React from 'react';
import { ChevronLeft, Coins, HelpCircle, Volume2, VolumeX, X } from 'lucide-react';
import { formatCoins } from './eliminConfig';

/** Üst şerit: bakiye sekmesi, kurallar, ses ve kapatma — düğmeler Şekerli Meyve'yle aynı. */
export default function EliminTopBar({ coins, sound, onSound, onCoins, onHelp, onBack, onExit }) {
  return (
    <header className="el-head">
      <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button type="button" onClick={onCoins} className="el-balance" aria-label="Coin yükle">
        <span className="el-balance-coin"><Coins className="h-3.5 w-3.5" /></span>
        <span>{formatCoins(coins)}</span>
      </button>

      <div className="min-w-0 flex-1" />

      <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon">
        <HelpCircle className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onSound}
        aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
        className={`gctl-pill gctl-icon ${sound ? 'gctl-pill-on' : ''}`}
      >
        {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
      <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="gctl-pill gctl-icon el-close-pill">
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}