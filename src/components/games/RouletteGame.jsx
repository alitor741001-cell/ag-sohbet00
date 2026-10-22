import React, { useEffect, useState } from 'react';
import { ChevronLeft, Lightbulb, X } from 'lucide-react';
import '@/styles/roulette.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import useRouletteGame from './roulette/useRouletteGame';
import useRouletteBoard from './roulette/useRouletteBoard';
import GameHelpSheet from './help/GameHelpSheet';
import RouletteWheel from './roulette/RouletteWheel';
import RouletteTopFive from './roulette/RouletteTopFive';
import RouletteHistory from './roulette/RouletteHistory';
import RouletteTable from './roulette/RouletteTable';
import RouletteChipRow from './roulette/RouletteChipRow';
import RouletteRoundBar from './roulette/RouletteRoundBar';
import RouletteWinOverlay from './roulette/RouletteWinOverlay';
import { formatCoins } from './roulette/rouletteConfig';

// Çark 4.4 saniyede yerine oturur: kazanan cep bundan sonra yakınlaştırılır.
const WHEEL_STOP_MS = 4500;
// Yakınlaştırma birkaç saniye görünür kalır, ardından çark eski haline döner.
const WHEEL_ZOOM_MS = 2600;

/** ROULETTE: tur kendi kendine döner — 20 saniye bahis, sonra çark ve yeni tur. */
export default function RouletteGame({ onExit, onBack }) {
  const game = useRouletteGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  // Çark durduğunda top kazanan cebe oturur ve o cep yakınlaştırılır.
  const [settled, setSettled] = useState(false);
  const [zoom, setZoom] = useState(false);
  const spinning = game.phase === 'spinning';
  const betting = game.phase === 'betting';
  // Numara ve cep yalnızca çark dönerken açıklanır.
  const landedIndex = spinning ? game.round?.index ?? null : null;
  const landedNumber = spinning ? game.round?.number ?? null : null;
  // Tur sıralaması her turda yenilenir.
  const board = useRouletteBoard(game.round?.round_no ?? 0);

  // Çark yerine oturunca top kazanan cebe oturur, cep büyütülür ve sonra çark geri çekilir.
  useEffect(() => {
    if (landedIndex === null) {
      setSettled(false);
      setZoom(false);
      return undefined;
    }
    const settle = window.setTimeout(() => {
      setSettled(true);
      setZoom(true);
    }, WHEEL_STOP_MS);
    const back = window.setTimeout(() => setZoom(false), WHEEL_STOP_MS + WHEEL_ZOOM_MS);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(back);
    };
  }, [landedIndex, game.round?.round_no]);

  // Tur sonucu: kazanç ödenmişse kutlama ekranı açılır.
  useEffect(() => {
    if (!game.result || !game.result.payout) return;
    setPrize({ amount: game.result.payout, number: game.result.number });
  }, [game.result]);

  return (
    <div className="rl-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="rl-rays" />

      {/* Üst bar: geri + TOP 5 + son numaralar + düğmeler */}
      <header className="rl-topbar">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <RouletteTopFive winners={board.winners} ready={board.status === 'ready'} />
        <div className="rl-topbar-right">
          <RouletteHistory entries={game.history} />
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Nasıl oynanır"
            className="gctl-pill gctl-icon"
          >
            <Lightbulb className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label="Oyunu kapat"
            className="gctl-pill gctl-icon ring-1 ring-[#f0c96b]/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Ana alan: çark + Başla + bahis masası */}
      <main className="rl-main">
        <div className="rl-wheel-arch">
          <RouletteWheel
            index={landedIndex}
            spinning={spinning}
            settled={settled}
            winner={settled ? landedNumber : null}
            zoom={zoom}
          />
        </div>

        <RouletteRoundBar phase={game.phase} countdown={game.countdown} progress={game.progress} />

        <RouletteTable bets={game.bets} disabled={!betting} onPlace={game.placeBet} />

        {game.status === 'loading' && <p className="rl-result-text">Oyun yükleniyor...</p>}
      </main>

      {/* Alt bar: bakiye + renkli jetonlar + REPEAT */}
      <footer className="rl-footer">
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
      </footer>

      {game.message && !coinOpen && !prize && (
        <p className="rl-message absolute left-1/2 top-[46%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[11px] font-bold">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.available} onBack={() => setCoinOpen(false)} />
      <GameHelpSheet game="roulette" open={helpOpen} onClose={() => setHelpOpen(false)} />

      <RouletteWinOverlay
        open={!!prize}
        amount={prize?.amount || 0}
        number={prize?.number}
        onAccept={() => setPrize(null)}
      />
    </div>
  );
}