import React from 'react';
import { ChevronLeft, Play, Volume2, VolumeX, X } from 'lucide-react';
import '@/styles/sekerli.css';
import '@/styles/gameControls.css';
import { Image } from '@/components/ui/image';
import SekerliGrid from './sekerli/SekerliGrid';
import SekerliTopPanel from './sekerli/SekerliTopPanel';
import SekerliStats from './sekerli/SekerliStats';
import SekerliFreeSpinPanel from './sekerli/SekerliFreeSpinPanel';
import SekerliFreeSpinIntro from './sekerli/SekerliFreeSpinIntro';
import SekerliWinOverlay from './sekerli/SekerliWinOverlay';
import useSekerliGame from './sekerli/useSekerliGame';
import useCountUp from './sekerli/useCountUp';
import { REFILL_CREDITS, LINES, formatCredits, formatMult } from './sekerli/sekerliConfig';
import { SEKERLI_BACKDROP, SEKERLI_LOGO } from './sekerli/sekerliAssets';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';

/**
 * ŞEKERLİ MEYVE: 5x4 takla zincirli şeker slotu.
 * Tamamı istemcide çalışan demo oyun; kredi, bahis ve kazanç yalnızca oyun içidir.
 */
export default function SekerliMeyveGame({ onExit, onBack }) {
  const game = useSekerliGame();
  const totalBet = game.bet * LINES;
  const shownWin = useCountUp(game.spinWin, 420);

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
        <SekerliTopPanel win={game.tumbleWin} multiplier={game.cascadeMult} active={game.phase !== 'idle'} />

        <div className="sl-stage">
          {game.inFree && <SekerliFreeSpinPanel left={game.freeLeft} total={game.freeTotal} />}
          <div className={`sl-frame ${game.phase === 'spin' ? 'sl-frame-live' : ''}`}>
            <span className="sl-frame-shine" aria-hidden="true" />
            <div className="sl-frame-inner">
              <SekerliGrid game={game} />
              {game.showWin && game.spinWin > 0 && (
                <p key={game.spinWin} className="sl-center-win">
                  KAZANÇ {formatCredits(shownWin)}
                  {game.cascadeMult > 1 && <span className="sl-center-mult">{formatMult(game.cascadeMult)}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        <SekerliStats credits={game.credits} bet={totalBet} win={game.spinWin} free={game.inFree} />

        {game.message && <p className="sl-message">{game.message}</p>}
        {game.broke && (
          <button type="button" onClick={game.refill} className="sl-refill">
            +{formatCredits(REFILL_CREDITS)} DEMO KREDİ
          </button>
        )}
      </main>

      <footer className="sl-foot">
        <div className="gctl-deck">
          <GameBetBar
            bet={game.bet}
            lines={LINES}
            disabled={game.busy || game.inFree}
            onStep={game.changeBet}
            onMax={game.maxBet}
            format={formatCredits}
          />
          <GameSpinButton
            spinning={game.spinning}
            disabled={game.busy || game.inFree}
            auto={game.auto}
            icon={Play}
            onSpin={game.spin}
            onStop={game.stop}
            onAuto={game.toggleAuto}
          />
        </div>
      </footer>

      <SekerliFreeSpinIntro open={game.freeIntro > 0} count={game.freeIntro} onStart={game.startFreeSpins} />

      <SekerliWinOverlay
        open={!!game.prize}
        title={game.prize?.label || ''}
        amount={game.prize?.amount || 0}
        multiplier={game.prize?.multiplier || 0}
        tone={game.prize?.tone}
        onAccept={game.continueAfterOverlay}
      />

      <SekerliWinOverlay
        open={!!game.bonus}
        title="BEDAVA ÇEVİRİM BİTTİ"
        subtitle="TOPLAM BONUS KAZANCI"
        amount={game.bonus?.amount || 0}
        tone="#ff5ac8"
        action="KABUL ET"
        onAccept={game.continueAfterOverlay}
      />
    </div>
  );
}