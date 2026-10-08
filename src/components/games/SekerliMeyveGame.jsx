import React, { useState } from 'react';
import { ChevronLeft, Play, Volume2, VolumeX, X } from 'lucide-react';
import '@/styles/sekerli.css';
import '@/styles/gameControls.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import SekerliGrid from './sekerli/SekerliGrid';
import SekerliTopPanel from './sekerli/SekerliTopPanel';
import SekerliHud from './sekerli/SekerliHud';
import SekerliWinOverlay from './sekerli/SekerliWinOverlay';
import useSekerliGame from './sekerli/useSekerliGame';
import useCountUp from './sekerli/useCountUp';
import { LINES, formatCredits, formatMult } from './sekerli/sekerliConfig';
import { SEKERLI_BACKDROP, SEKERLI_LOGO } from './sekerli/sekerliAssets';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import GameTurnBadge from './controls/GameTurnBadge';

/**
 * ŞEKERLİ MEYVE: 5x4 takla zincirli şeker slotu.
 * Bahis coin bakiyesinden düşülür; "15 çevirme hakkı" paketiyle turlar serbest çevrilir.
 */
export default function SekerliMeyveGame({ onExit, onBack }) {
  const game = useSekerliGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const shownWin = useCountUp(game.spinWin, 420);
  const ready = game.status === 'ready';

  return (
    <div className="sl-sky">
      <div className="sl-backdrop">
        <Image src={SEKERLI_BACKDROP} alt="" aria-hidden="true" className="h-full w-full" fittingType="fill" quality={70} />
      </div>
      <span className="sl-aurora" aria-hidden="true" />

      <header className="sl-head">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="sl-brand">
          <Image src={SEKERLI_LOGO} alt="" aria-hidden="true" className="sl-logo" fittingType="fill" quality={80} />
          <span className="sl-brand-text">
            <p className="sl-title">ŞEKERLİ MEYVE</p>
            <p className="sl-tagline">TAKLA ZİNCİRİ · {LINES} SATIR</p>
          </span>
        </div>
        <button
          type="button"
          onClick={game.toggleSound}
          aria-label={game.sound ? 'Sesi kapat' : 'Sesi aç'}
          className={`gctl-pill gctl-icon ${game.sound ? 'gctl-pill-on' : ''}`}
        >
          {game.sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="gctl-pill gctl-icon sl-close">
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="sl-main">
        <SekerliTopPanel win={game.spinWin} multiplier={game.multiplier} active={game.phase !== 'idle'} />

        <div className="sl-stage">
          <div className={`sl-frame ${game.phase === 'spin' ? 'sl-frame-live' : ''}`}>
            <span className="sl-frame-shine" aria-hidden="true" />
            <div className="sl-frame-inner">
              <SekerliGrid game={game} />
              {game.showWin && game.spinWin > 0 && (
                <p key={game.spinWin} className="sl-center-win">
                  KAZANÇ {formatCredits(shownWin)}
                  {game.multiplier > 1 && <span className="sl-center-mult">{formatMult(game.multiplier)}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        <GameTurnBadge sessionSpins={game.sessionSpins} accent="border-[#ffd21f]/80 text-[#ffe9b8]" />

        <SekerliHud
          coins={game.coins}
          bet={game.bet}
          win={game.win}
          totalWon={game.totalWon}
          busy={game.busy}
          onCoins={() => setCoinOpen(true)}
          onSession={game.buySession}
          sessionPrice={game.sessionPrice}
          sessionSpins={game.sessionSpins}
          sessionSize={game.sessionSize}
        />

        {game.status === 'loading' && <p className="sl-message">Oyun yükleniyor...</p>}
        {game.message && <p className="sl-message">{game.message}</p>}
      </main>

      <footer className="sl-foot">
        <div className="gctl-deck">
          <GameBetBar
            bet={game.bet}
            lines={LINES}
            disabled={game.busy}
            onStep={game.changeBet}
            onMax={game.maxBet}
            format={formatCredits}
          />
          <GameSpinButton
            spinning={game.spinning}
            disabled={!ready}
            auto={game.auto}
            icon={Play}
            onSpin={game.spin}
            onStop={game.stop}
            onAuto={game.toggleAuto}
          />
        </div>
      </footer>

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <SekerliWinOverlay
        open={!!game.prize}
        title={game.prize?.label || ''}
        amount={game.prize?.amount || 0}
        multiplier={game.prize?.multiplier || 0}
        tone={game.prize?.tone}
        onAccept={game.continueAfterOverlay}
      />

      {/* 15 çevirme hakkı bittiğinde biriken toplam kazanç onaya sunulur. */}
      <SekerliWinOverlay
        open={game.sessionResult !== null}
        title="15 ÇEVİRME HAKKI BİTTİ"
        subtitle="TOPLAM KAZANÇ"
        amount={game.sessionResult || 0}
        action="KABUL ET"
        onAccept={game.clearSessionResult}
      />
    </div>
  );
}