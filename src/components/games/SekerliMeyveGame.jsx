import React, { useEffect, useState } from 'react';
import '@/styles/sekerli.css';
import '@/styles/gameControls.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import MatchingSlotDeck from '@/components/games/controls/MatchingSlotDeck';
import GameIllustratedHeader from '@/components/games/shared/GameIllustratedHeader';
import GameFullThemeBackdrop from '@/components/games/shared/GameFullThemeBackdrop';
import SekerliGrid from './sekerli/SekerliGrid';
import SekerliTopPanel from './sekerli/SekerliTopPanel';
import SekerliWinOverlay from './sekerli/SekerliWinOverlay';
import GameHelpSheet from './help/GameHelpSheet';
import useSekerliGame from './sekerli/useSekerliGame';
import useCountUp from './sekerli/useCountUp';
import { LINES, formatCredits, formatMult } from './sekerli/sekerliConfig';
import { SEKERLI_ART, SEKERLI_BACKDROP, SEKERLI_LOGO } from './sekerli/sekerliAssets';
import { warmSymbolTiles } from '@/lib/symbolTile';
import GameTurnBadge from './controls/GameTurnBadge';

/**
 * ŞEKERLİ MEYVE: 5x4 takla zincirli şeker slotu.
 * Bahis coin bakiyesinden düşülür; "15 çevirme hakkı" paketiyle turlar serbest çevrilir.
 */
export default function SekerliMeyveGame({ onExit, onBack }) {
  const game = useSekerliGame();
  useEffect(() => { warmSymbolTiles(Object.values(SEKERLI_ART)); }, []);
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const shownWin = useCountUp(game.spinWin, 420);

  return (
    <div className="sl-sky">
      <GameFullThemeBackdrop game="sekerli" />

      <GameIllustratedHeader game="sekerli" title="ŞEKERLİ MEYVE" tagline={`TAKLA ZİNCİRİ · ${LINES} SATIR`} onBack={onBack} onHelp={() => setHelpOpen(true)} sound={game.sound} onSound={game.toggleSound} />

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



        {game.status === 'loading' && <p className="sl-message">Oyun yükleniyor...</p>}
        {game.message && <p className="sl-message">{game.message}</p>}
      </main>

      <MatchingSlotDeck game={game} theme="sekerli" lines={LINES} win={game.busy ? game.spinWin : game.win}
        spinning={game.busy && !game.prize} busy={game.busy} onCoins={() => setCoinOpen(true)} />

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />
      <GameHelpSheet game="sekerli" open={helpOpen} onClose={() => setHelpOpen(false)} />

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