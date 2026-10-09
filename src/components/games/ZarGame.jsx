import React, { useEffect, useState } from 'react';
import { ChevronLeft, Clapperboard, Coins, Crown, HelpCircle, Star, X } from 'lucide-react';
import '@/styles/zar.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import GameStatCards from '@/components/games/controls/GameStatCards';
import GameHelpSheet from '@/components/games/help/GameHelpSheet';
import { ZAR_LOGO } from './zar/zarAssets';
import { formatCoins, outcomeName } from './zar/zarConfig';
import useZarGame from './zar/useZarGame';
import useZarBoard from './zar/useZarBoard';
import ZarChipRow from './zar/ZarChipRow';
import ZarHistory from './zar/ZarHistory';
import ZarPodium from './zar/ZarPodium';
import ZarRoundBar from './zar/ZarRoundBar';
import ZarShaker from './zar/ZarShaker';
import ZarTable from './zar/ZarTable';
import ZarWinOverlay from './zar/ZarWinOverlay';

/** ZAR: üç zarla oynanan Küçük / Büyük / Kaplan masası.
    Tur kendi kendine döner: 20 saniye bahis, sonra zarlar kase içinde çalkalanır
    ve masaya açılır. */
export default function ZarGame({ onExit, onBack }) {
  const game = useZarGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [prize, setPrize] = useState(null);

  const betting = game.phase === 'betting';
  const shaking = game.phase === 'shaking';
  // Zarlar ve toplam yalnızca çalkalama anında açıklanır.
  const dice = shaking ? game.round?.dice ?? null : null;
  const sum = shaking ? game.round?.sum ?? null : null;
  const outcome = shaking ? game.round?.outcome ?? null : null;
  // Tur sıralaması ve alan toplamları her turda yenilenir.
  const board = useZarBoard(game.round?.round_no ?? 0);

  const stats = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(game.available), icon: Star },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(game.stake), icon: Clapperboard },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(game.payout), icon: Crown, win: game.payout > 0 },
    { key: 'total', label: 'TOPLAM KAZANÇ', value: formatCoins(game.totalWon), icon: Coins },
  ];

  // Tur sonucu: kazanç ödenmişse kutlama ekranı açılır.
  useEffect(() => {
    if (!game.result || !game.result.payout) return;
    setPrize({ amount: game.result.payout, dice: game.result.dice, sum: game.result.sum, outcome: game.result.outcome });
  }, [game.result]);

  return (
    <div className="zar-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="zar-sky-glow" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Image src={ZAR_LOGO} alt="" aria-hidden="true" className="zar-logo" fittingType="fill" quality={80} />
          <span className="min-w-0">
            <p className="zar-title">ZAR</p>
            <p className="zar-subtitle">ÜÇ ZAR · KÜÇÜK &amp; BÜYÜK</p>
          </span>
        </div>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="gctl-pill gctl-icon ring-1 ring-[#f0c96b]/50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="relative z-10 shrink-0 px-3 pt-1.5">
        <div className="mx-auto w-full max-w-[27rem] sm:max-w-[32rem]">
          <GameStatCards items={stats} />
        </div>
      </div>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-2">
        <div className="zar-shaker-row">
          <ZarShaker dice={dice} phase={game.phase} />
          {/* Zar sonucu: açılan zarların toplamı ve düştüğü alan. */}
          <p className={`zar-sum${sum ? ' zar-sum-live' : ''}`}>
            {sum
              ? `TOPLAM ${sum} · ${outcomeName(outcome)}`
              : 'ZARLAR KASEDE'}
          </p>
        </div>

        <div className="zar-felt-body">
          <ZarHistory entries={game.history} />
          <ZarTable
            bets={game.bets}
            zoneTotals={board.zoneTotals}
            disabled={!betting}
            revealed={shaking}
            outcome={outcome}
            onPlace={game.placeBet}
          />
        </div>

        <ZarPodium winners={board.winners} ready={board.status === 'ready'} />

        {game.status === 'loading' && <p className="zar-sum">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <div className="zar-deck">
          <ZarChipRow
            coins={game.available}
            chip={game.chip}
            stake={game.stake}
            canRepeat={!!game.lastBets}
            disabled={!betting}
            onChip={game.setChip}
            onRepeat={game.repeat}
            onClear={game.clearBets}
            onCoins={() => setCoinOpen(true)}
          />
          <ZarRoundBar
            phase={game.phase}
            countdown={game.countdown}
            progress={game.progress}
            roundNo={game.round?.round_no}
          />
        </div>
      </footer>

      {game.message && !coinOpen && !prize && (
        <p className="zar-message absolute left-1/2 top-[46%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[11px] font-bold">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.available} onBack={() => setCoinOpen(false)} />
      <GameHelpSheet game="zar" open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ZarWinOverlay
        open={!!prize}
        amount={prize?.amount || 0}
        dice={prize?.dice}
        sum={prize?.sum}
        outcome={prize?.outcome}
        onAccept={() => setPrize(null)}
      />
    </div>
  );
}