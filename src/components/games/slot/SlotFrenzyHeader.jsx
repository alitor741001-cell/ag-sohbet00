import React from 'react';
import { HelpCircle, Volume2, VolumeX } from 'lucide-react';
import WinnerTicker, { TICKER_ROW_HEIGHT } from './WinnerTicker';
import './slotFrenzy.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** SLOT FRENZY üst sahnesi: mor kadife kemer, kazananlar panosu ve 5'li Jackpot konsolu. */
export default function SlotFrenzyHeader({
  pools,
  sound = true,
  compact = false,
  onHelp,
  onSound,
}) {
  const tickerHeight = TICKER_ROW_HEIGHT * (compact ? 2 : 3);
  const jackpot = format(pools?.jackpot ?? 26978691);
  const colossal = format(pools?.xmega ?? 18885084);
  const mega = format(pools?.mega ?? 4046804);
  const big = format(pools?.big ?? 2697869);
  const mini = format(pools?.mini ?? 1348934);

  return (
    <header className={`sfz-stage relative shrink-0 pt-[env(safe-area-inset-top)] ${compact ? 'is-compact' : ''}`}>
      {/* Şehir silüeti ve mor kadife perdeler */}
      <span aria-hidden="true" className="sfz-skyline" />
      <span aria-hidden="true" className="sfz-curtain sfz-curtain-l" />
      <span aria-hidden="true" className="sfz-curtain sfz-curtain-r" />

      {/* Üst kemer: SLOT FRENZY başlığı ve sol/sağ yuvarlak butonlar */}
      <div className="sfz-top-row">
        <div className="sfz-left-orbs">
          <button
            type="button"
            onClick={onHelp}
            aria-label="Nasıl oynanır"
            className="sfz-round-btn"
          >
            <HelpCircle className="h-5 w-5" strokeWidth={2.8} />
          </button>
        </div>

        <div className="sfz-arch">
          <span className="sfz-brand-text">SLOT</span>
        </div>

        <div className="sfz-right-orbs">
          <button
            type="button"
            onClick={onSound}
            aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
            className="sfz-round-btn"
          >
            {sound ? <Volume2 className="h-5 w-5" strokeWidth={2.6} /> : <VolumeX className="h-5 w-5" strokeWidth={2.6} />}
          </button>
        </div>
      </div>

      {/* Orta kısım: kazanan şeridi panosu */}
      <div className="sfz-mid-wrap">
        <div className="sfz-ticker-box">
          <WinnerTicker height={tickerHeight} />
        </div>
      </div>

      {/* Alt Jackpot Konsolu: colossal / big solda, ortada Jackpot kalkanı, sağda mega / mini */}
      <div className="sfz-jackpot-bar">
        <div className="sfz-pool-col is-left">
          <div className="sfz-pool-line">
            <span className="sfz-pool-tag is-colossal">colossal</span>
            <span className="sfz-pool-num is-pink">{colossal}</span>
          </div>
          <div className="sfz-pool-line">
            <span className="sfz-pool-tag is-big">big</span>
            <span className="sfz-pool-num is-pink">{big}</span>
          </div>
        </div>

        <div className="sfz-center-shield">
          <span className="sfz-jackpot-script">Jackpot</span>
          <span className="sfz-jackpot-total">{jackpot}</span>
        </div>

        <div className="sfz-pool-col is-right">
          <div className="sfz-pool-line is-right">
            <span className="sfz-pool-num is-pink">{mega}</span>
            <span className="sfz-pool-tag is-mega">mega</span>
          </div>
          <div className="sfz-pool-line is-right">
            <span className="sfz-pool-num is-pink">{mini}</span>
            <span className="sfz-pool-tag is-mini">mini</span>
          </div>
        </div>
      </div>
    </header>
  );
}