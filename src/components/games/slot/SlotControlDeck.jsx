import React from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import FitGameText from '@/components/games/controls/FitGameText';
import compactCoins from '@/lib/compactCoins';
import './slotFrenzy.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** SLOT FRENZY alt kontrol konsolu: LINES, TOTAL BET, WIN oyukları; BET -/+, MAX, coin/kedi hapı, sarı AUTO ve yeşil SPIN. */
export default function SlotControlDeck({
  coins,
  bet,
  lines,
  win,
  freeSpins,
  auto,
  spinning,
  ready,
  onStep,
  onMax,
  onAuto,
  onSpin,
  onStop,
  onCoins,
}) {
  return (
    <footer className="sfz-deck">
      {/* Üst gösterge sırası: LINES 50 | TOTAL BET 500 | WIN 0 */}
      <div className="sfz-deck-top">
        <div className="sfz-metric-lines">
          <span className="sfz-metric-label">LINES</span>
          <strong className="sfz-metric-pink">{lines}</strong>
        </div>

        <div className="sfz-metric-well">
          <span className="sfz-metric-label">TOTAL BET</span>
          <FitGameText as="strong" className="sfz-metric-gold">
            {format(bet * lines)}
          </FitGameText>
        </div>

        <div className="sfz-metric-well">
          <span className="sfz-metric-label">WIN</span>
          <FitGameText as="strong" className="sfz-metric-gold">
            {format(win)}
          </FitGameText>
        </div>

        {/* SPIN butonunun üst boşluğu */}
        <div aria-hidden="true" />
      </div>

      {/* Alt kontrol sırası: Sol kedi/coin hapı + Orta BET ve MAX + Sağ AUTO ve yüksek SPIN */}
      <div className="sfz-deck-main">
        {/* Sol alt: mavi parlayan kedi ikonlu bakiye/hak hapı */}
        <button
          type="button"
          onClick={onCoins}
          className="sfz-cat-pill"
          aria-label="Coin Yükle"
        >
          <span className="sfz-cat-avatar" aria-hidden="true">
            <span className="sfz-cat-glasses">🕶️</span>
            🐱
          </span>
          <span className="sfz-cat-count">
            {freeSpins > 0 ? freeSpins : compactCoins(coins ?? 0)}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#f5d0fe]" strokeWidth={3} />
        </button>

        {/* Orta sütun: BET [- 10 +] kapsülü ve altında gümüş MAX hapı */}
        <div className="sfz-bet-stack">
          <div className="sfz-bet-capsule">
            <button
              type="button"
              disabled={spinning}
              onClick={() => onStep(-1)}
              aria-label="Bahsi azalt"
              className="sfz-bet-side is-minus"
            >
              <Minus className="h-4 w-4" strokeWidth={3.5} />
            </button>

            <div className="sfz-bet-center">
              <span className="sfz-bet-label">BET</span>
              <FitGameText as="strong" className="sfz-bet-val">
                {format(bet)}
              </FitGameText>
            </div>

            <button
              type="button"
              disabled={spinning}
              onClick={() => onStep(1)}
              aria-label="Bahsi artır"
              className="sfz-bet-side is-plus"
            >
              <Plus className="h-4 w-4" strokeWidth={3.5} />
            </button>
          </div>

          <button
            type="button"
            disabled={!ready || spinning}
            onClick={onMax}
            className="sfz-max-pill"
          >
            MAX
          </button>
        </div>

        {/* Sarı parlak AUTO butonu */}
        <button
          type="button"
          disabled={!ready}
          onClick={onAuto}
          aria-pressed={auto}
          className={`sfz-auto-btn ${auto ? 'is-active' : ''}`}
        >
          <span className="sfz-btn-gloss" aria-hidden="true" />
          <span>AUTO</span>
        </button>

        {/* Sağda yüksek parlak yeşil SPIN / STOP butonu */}
        <button
          type="button"
          disabled={!spinning && !ready}
          onClick={spinning ? onStop : onSpin}
          className={`sfz-spin-btn ${spinning ? 'is-stop' : ''}`}
        >
          <span className="sfz-btn-gloss" aria-hidden="true" />
          <span>{spinning ? 'STOP' : 'SPIN'}</span>
        </button>
      </div>
    </footer>
  );
}