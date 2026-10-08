import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, HelpCircle, X } from 'lucide-react';
import GameHelpSheet from './help/GameHelpSheet';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { SLOT_ART } from './slotAssets';
import { ART_HEAD_HEIGHT, ART_HEIGHT, ART_VISIBLE_HEIGHT, ART_WIDTH } from './slot/slotLayout';
import useSlotGame from './slot/useSlotGame';
import SlotReels from './slot/SlotReels';
import SlotWinLines from './slot/SlotWinLines';
import SlotWinOverlay from './slot/SlotWinOverlay';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import WinnerTicker, { TICKER_ROW_HEIGHT } from './slot/WinnerTicker';
import SlotJackpotBar from './slot/SlotJackpotBar';
import SlotTierAlert from './slot/SlotTierAlert';
import FreeSpinBadge from './slot/FreeSpinBadge';
import SlotControlDeck from './slot/SlotControlDeck';
import { tierOfBet } from './slot/slotConfig';

// Görsel alanı doldururken en fazla bu oranda kırpılır; panelde siyah boşluk kalmaz.
const MAX_CROP = 1.06;
// Kazanan şeridinde görünen satır sayısı.
const TICKER_ROWS = 3;
// Rozetler oyun ekranının üst kenarından bu kadar aşağıda durur.
const BADGE_TOP = 8;
const WIN_FLASH_MS = 2400;
// Bu tutarın üzerindeki kazançlarda kutlama ekranı açılır.
const PRIZE_THRESHOLD = 20000;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotGame({ onExit, onBack, roomId }) {
  const { user } = useCurrentUser();
  const game = useSlotGame({ roomId });
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);
  const areaRef = useRef(null);
  const size = useSize(areaRef);
  const tickerHeight = TICKER_ROW_HEIGHT * TICKER_ROWS;

  // Her turun sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    window.clearTimeout(flashTimer.current);
    if (!game.spins) return undefined;
    if (game.win >= PRIZE_THRESHOLD) {
      setPrize({ amount: game.win, jackpot: game.jackpotHit });
      return undefined;
    }
    // Kazanç yoksa yazı hemen silinir; varsa kısa süre görünüp kendiliğinden kapanır.
    setFlash(game.win > 0 ? game.win : 0);
    if (game.win > 0) {
      flashTimer.current = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
    }
    return undefined;
  }, [game.spins]);

  // Oyun kapanırken bekleyen sayaç temizlenir.
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Görsel, kendi üst jackpot paneli ile alt kontrol alanı arasında gösterilir.
  const areaWidth = size?.width || 0;
  const areaHeight = size?.height || 0;
  const fit = Math.min(areaWidth / ART_WIDTH, areaHeight / ART_VISIBLE_HEIGHT);
  const cover = Math.max(areaWidth / ART_WIDTH, areaHeight / ART_VISIBLE_HEIGHT);
  const scale = Math.min(cover || 0, (fit || 0) * MAX_CROP);
  const width = ART_WIDTH * scale;
  const height = ART_HEIGHT * scale;
  // Görselin görünen yüksekliği ve üstten kırpılan payı.
  const viewHeight = ART_VISIBLE_HEIGHT * scale;
  const headOffset = ART_HEAD_HEIGHT * scale;
  const ready = game.status === 'ready';
  // Bahis kademesi: kademe atlayınca üstte kırmızı uyarı çıkar.
  const tier = tierOfBet(game.bet, game.lines);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slot">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image src={SLOT_ART.shell} alt="" className="h-full w-full scale-125 blur-2xl" fittingType="fill" quality={25} />
        <div className="absolute inset-0 bg-slot/65" />
      </div>

      {/* Üst: kazanan şeridi ve kendi jackpot konsolumuz. */}
      <div className="relative z-10 shrink-0 pt-[env(safe-area-inset-top)]">
        <WinnerTicker height={tickerHeight} />
        <SlotJackpotBar pools={game.pools} tier={tier} />
      </div>

      <button
        type="button"
        onClick={onBack}
        aria-label="Oyun listesine dön"
        className="absolute left-2 top-[env(safe-area-inset-top)] z-20 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Nasıl oynanır"
        className="absolute right-14 top-[env(safe-area-inset-top)] z-20 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onExit}
        aria-label="Oyunu kapat"
        className="absolute right-2 top-[env(safe-area-inset-top)] z-20 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Oyun ekranı: görselin kırpılan iki paneli arasında kalan kısım alta yaslanır. */}
      <div ref={areaRef} className="relative flex min-h-0 flex-1 items-end justify-center overflow-hidden">
        {width > 0 && (
          <div className="relative overflow-hidden" style={{ width, height: viewHeight }}>
            <div className="absolute inset-x-0" style={{ height, top: -headOffset }}>
              <Image
                src={SLOT_ART.shell}
                alt="slot"
                className="absolute inset-0 h-full w-full"
                fittingType="fill"
                quality={92}
              />

              {/* Tur sırasında her makaranın sembolleri değişerek aşağı doğru kayar. */}
              <SlotReels spinning={game.spinning} stopping={game.stopping} slow={game.slow} grid={game.grid} />

              {/* Kazanan semboller ve aralarından geçen kazanç çizgileri — yeni tur başlayana kadar ekranda kalır. */}
              {!game.spinning && <SlotWinLines wins={game.wins} />}

              {game.status === 'loading' && (
                <p className="absolute inset-x-0 top-[62%] -translate-y-1/2 text-center text-xs font-bold text-white/80">
                  Oyun yükleniyor...
                </p>
              )}

              {flash > 0 && !game.spinning && !prize && (
                <p
                  key={flash}
                  className="game-win-float pointer-events-none absolute left-1/2 top-[54%] z-10 rounded-full border border-slot-gold/60 bg-black/70 px-3 py-1 font-mono text-sm font-black text-slot-gold"
                >
                  WIN {format(flash)}
                </p>
              )}

              {game.message && !coinOpen && !prize && (
                <p className="absolute left-1/2 top-[74%] z-10 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-center text-[11px] font-bold text-slot-gold">
                  {game.message}
                </p>
              )}
            </div>
          </div>
        )}

        <FreeSpinBadge count={game.freeSpins} top={BADGE_TOP} />
        <SlotTierAlert tier={tier} top={BADGE_TOP + (game.freeSpins > 0 ? 36 : 0)} />
      </div>

      {/* Alt kontrol paneli: görselin kendi kontrol alanının yerini alır. */}
      <SlotControlDeck
        coins={game.coins}
        bet={game.bet}
        lines={game.lines}
        win={game.win}
        auto={game.auto}
        spinning={game.spinning}
        ready={ready}
        onStep={game.changeBet}
        onMax={game.maxBet}
        onAuto={game.toggleAuto}
        onSpin={game.spin}
        onStop={game.stop}
        onCoins={() => setCoinOpen(true)}
      />

      <SlotWinOverlay
        open={!!prize}
        jackpot={!!prize?.jackpot}
        amount={prize?.amount || 0}
        winner={user?.full_name || user?.username || ''}
        onAccept={() => setPrize(null)}
      />

      {/* Coin kutusuna dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel
        open={coinOpen}
        coins={game.coins}
        onBack={() => setCoinOpen(false)}
      />

      <GameHelpSheet game="slot" open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}