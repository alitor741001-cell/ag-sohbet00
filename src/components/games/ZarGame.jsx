import React, { useEffect, useState } from 'react';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import '@/styles/zar.css';
import '@/styles/zar2.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import GameCoinBar from '@/components/games/shared/GameCoinBar';
import GameHelpSheet from '@/components/games/help/GameHelpSheet';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { SHAKE_HIDE_MS, outcomeName, formatCoins } from './zar/zarConfig';
import ZarDie from './zar/ZarDie';
import ZarTimerBand from './zar/ZarTimerBand';
import useZarGame from './zar/useZarGame';
import useZarBoard from './zar/useZarBoard';
import useZarBets from './zar/useZarBets';
import ZarChipRow from './zar/ZarChipRow';
import ZarHistory from './zar/ZarHistory';
import ZarShaker from './zar/ZarShaker';
import ZarTable from './zar/ZarTable';
import ZarWinOverlay from './zar/ZarWinOverlay';
import { WIN_CARD_THRESHOLD } from '@/components/games/shared/winCard';

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
  // Kase önce kapalı çalkalanır; zarlar kase kalktıktan sonra açıklanır.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!shaking) {
      setRevealed(false);
      return undefined;
    }
    setRevealed(false);
    const timer = setTimeout(() => setRevealed(true), SHAKE_HIDE_MS);
    return () => clearTimeout(timer);
  }, [shaking, game.round?.round_no]);
  // Zarlar ve toplam yalnızca kase kalktıktan sonra açıklanır.
  const dice = revealed ? game.round?.dice ?? null : null;
  const sum = revealed ? game.round?.sum ?? null : null;
  const outcome = revealed ? game.round?.outcome ?? null : null;
  // YENİ paneli zarlar açıkken doğrudan onları gösterir: geçmiş listesi önceki turlara iner.
  const liveRound = dice ? { round_no: game.round?.round_no, d1: dice[0], d2: dice[1], d3: dice[2], sum } : null;
  // Sıralama son sonuçlanan turdan okunur: yeni bahis turu açıldığında da
  // kazananlar ekranda kalır ve her turda tazelenir.
  const settledRound = game.history?.[0]?.round_no ?? game.round?.round_no ?? 0;
  const board = useZarBoard(settledRound);
  // Turun tutarları: alanlara yatırılan miktarlar profilsiz olarak herkese görünür.
  const { user } = useCurrentUser();
  const { chips, totals } = useZarBets(game.round?.round_no || 0, user?.id);


  // Tur sonucu: kazanç ödenmişse kutlama ekranı açılır.
  // Kutlama ekranı da kase kalkıp zarlar açıldıktan sonra belirir.
  useEffect(() => {
    if (!game.result || game.result.payout < WIN_CARD_THRESHOLD || !revealed) return;
    setPrize({ amount: game.result.payout, dice: game.result.dice, sum: game.result.sum, outcome: game.result.outcome });
  }, [game.result, revealed]);

  return (
    <div className="zr2 relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <header className="zr2-top">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="zr2-sq">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="zr2-round">Tur:{game.round?.round_no || '—'}</span>

      </header>

      <main className="zr2-stage">
        <div className="zr2-side-right">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label="Nasıl oynanır" className="zr2-sq zr2-bulb">
            <Lightbulb className="h-5 w-5" />
          </button>
        </div>
        <ZarHistory entries={game.history} live={liveRound} />

        <div className="zr2-rail">
          <div className="zr2-felt">
            <div className={`zr2-shaker ${shaking ? 'zr2-shaker-center' : ''}`}>
              <ZarShaker dice={dice} phase={game.phase} revealed={revealed} />
            </div>
            <div className="zr2-dice-slots">
              {[0, 1, 2].map((i) => (
                <span key={i} className="zr2-slot">
                  <ZarDie value={(dice || game.history?.[0] && [game.history[0].d1, game.history[0].d2, game.history[0].d3] || [1, 1, 1])[i] || 1} tone="white" size="mini" />
                </span>
              ))}
            </div>
            <ZarTable
              bets={game.bets}
              zoneTotals={totals}
              chips={chips}
              disabled={!betting}
              revealed={revealed}
              outcome={outcome}
              onPlace={game.placeBet}
            />
            <ZarTimerBand phase={game.phase} countdown={game.countdown} />
            {sum ? <p className="zr2-sum">TOPLAM {sum} · {outcomeName(outcome)}</p> : null}
            <div className="zr2-lane" />
          </div>
        </div>
        {game.status === 'loading' && <p className="zr2-loading">Oyun yükleniyor...</p>}
      </main>

      <footer className="rl2-footer zr2-footer">
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
      </footer>

      {game.message && !coinOpen && !prize && (
        <p className="zar-message absolute left-1/2 top-[46%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[11px] font-bold">
          {game.message}
        </p>
      )}

      {/* Tur kazancı: küçük kazançlar da tur bitince kaybolmaz, sonraki tura kadar yazılı kalır. */}
      {game.payout > 0 && !prize && (
        <p className="zar-message absolute left-1/2 top-[56%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[12px] font-black">
          KAZANÇ {formatCoins(game.payout)}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <GameCoinBar coins={game.available} onClick={() => setCoinOpen(true)} />
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