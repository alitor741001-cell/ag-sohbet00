import React, { useEffect, useState } from 'react';
import { Clapperboard, ChevronLeft, Coins, Crown, Star, X } from 'lucide-react';
import '@/styles/roulette.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import useRouletteGame from './roulette/useRouletteGame';
import useRouletteBoard from './roulette/useRouletteBoard';
import RouletteWheel from './roulette/RouletteWheel';
import RoulettePodium from './roulette/RoulettePodium';
import RouletteHistory from './roulette/RouletteHistory';
import RouletteTable from './roulette/RouletteTable';
import RouletteChipRow from './roulette/RouletteChipRow';
import RouletteRoundBar from './roulette/RouletteRoundBar';
import RouletteWinOverlay from './roulette/RouletteWinOverlay';
import GameStatCards from './controls/GameStatCards';
import { ROULETTE_LOGO } from './roulette/rouletteAssets';
import { formatCoins, pocketName, pocketTone } from './roulette/rouletteConfig';

/** ROULETTE: tur kendi kendine döner — 20 saniye bahis, sonra çark ve yeni tur. */
export default function RouletteGame({ onExit, onBack }) {
  const game = useRouletteGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  const spinning = game.phase === 'spinning';
  const betting = game.phase === 'betting';
  // Tur sıralaması her turda yenilenir.
  const board = useRouletteBoard(game.round?.round_no ?? 0);
  // Üst metrikler: referans tasarımdaki siyah-altın kartlar.
  const stats = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(game.available), icon: Star },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(game.stake), icon: Clapperboard },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(game.payout), icon: Crown, win: game.payout > 0 },
    { key: 'total', label: 'TOPLAM KAZANÇ', value: formatCoins(game.totalWon), icon: Coins },
  ];

  // Tur sonucu: kazanç ödenmişse kutlama ekranı açılır.
  useEffect(() => {
    if (!game.result || !game.result.payout) return;
    setPrize({ amount: game.result.payout, number: game.result.number });
  }, [game.result]);

  return (
    <div className="rl-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="rl-rays" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Image src={ROULETTE_LOGO} alt="" aria-hidden="true" className="rl-logo" fittingType="fill" quality={80} />
          <span className="min-w-0">
            <p className="rl-title">ROULETTE</p>
            <p className="rl-subtitle">TEK SIFIR · 0 x36 ÖDER</p>
          </span>
        </div>
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
        <div className="mx-auto w-full max-w-[27rem]">
          <GameStatCards items={stats} />
        </div>
      </div>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-2">
        {/* Çark solda, tur sıralaması sağında alt alta durur. */}
        <div className="rl-stage">
          <div className="rl-wheel-wrap">
            <RouletteWheel index={spinning ? game.round?.index ?? null : null} spinning={spinning} />
          </div>
          <RoulettePodium winners={board.winners} ready={board.status === 'ready'} />
        </div>

        <div className="rl-result">
          {game.round?.number !== null && game.round?.number !== undefined ? (
            <>
              <span className={`rl-result-pocket rl-pocket-${pocketTone(game.round.number)}`}>{game.round.number}</span>
              <span className="rl-result-text">
                {pocketName(game.round.number)} · {game.payout > 0 ? `ÖDENEN ${formatCoins(game.payout)}` : 'TUR SONUCU'}
              </span>
            </>
          ) : (
            <span className="rl-result-text">
              {spinning ? 'ÇARK DÖNÜYOR...' : `TOPLAM KAZANÇ ${formatCoins(game.totalWon)} · ${game.spins} TUR`}
            </span>
          )}
        </div>

        <RouletteHistory entries={game.history} />

        <RouletteTable bets={game.bets} disabled={!betting} onPlace={game.placeBet} />

        {game.status === 'loading' && <p className="rl-result-text">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <div className="gctl-deck">
          <RouletteChipRow
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
          <RouletteRoundBar phase={game.phase} countdown={game.countdown} progress={game.progress} />
        </div>
      </footer>

      {game.message && !coinOpen && !prize && (
        <p className="rl-message absolute left-1/2 top-[46%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[11px] font-bold">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.available} onBack={() => setCoinOpen(false)} />

      <RouletteWinOverlay
        open={!!prize}
        amount={prize?.amount || 0}
        number={prize?.number}
        onAccept={() => setPrize(null)}
      />
    </div>
  );
}