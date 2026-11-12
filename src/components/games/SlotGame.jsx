import React, { useEffect, useRef, useState } from 'react';
import GameHelpSheet from './help/GameHelpSheet';
import { useSize } from '@/hooks/use-size';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { ART_HEAD_HEIGHT, ART_HEIGHT, ART_VISIBLE_HEIGHT } from './slot/slotLayout';
import useSlotGame from './slot/useSlotGame';
import SlotReels from './slot/SlotReels';
import SlotWinLines from './slot/SlotWinLines';
import SlotWinOverlay from './slot/SlotWinOverlay';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import SlotFrenzyHeader from './slot/SlotFrenzyHeader';
import SlotTierAlert from './slot/SlotTierAlert';
import SlotControlDeck from './slot/SlotControlDeck';
import { tierOfBet } from './slot/slotConfig';
import { eliminSound, unlockAudio } from './elimin/eliminSound';

// Üst havuz paneli makara çerçevesine doğrudan bitişir.
// Kademe uyarısı oyun ekranının üst kenarından bu kadar aşağıda durur.
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
  const [sound, setSound] = useState(true);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);
  const areaRef = useRef(null);
  const size = useSize(areaRef);
  // Sesli oda içinde oyun yarım panelde açılır: üst sahne kısalır, oyun alanı genişler.
  const inRoom = !!roomId;

  // Her turun sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    window.clearTimeout(flashTimer.current);
    if (!game.spins) return undefined;
    if (sound && game.win > 0) {
      if (game.win >= PRIZE_THRESHOLD) eliminSound.bigWin();
      else eliminSound.win();
    }
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
  // Çerçeve kalan alanı doldurur: oran sınırlaması üstte boş şerit bırakmaz.
  const scaleY = areaHeight / ART_VISIBLE_HEIGHT;
  const width = areaWidth;
  const height = ART_HEIGHT * scaleY;
  const viewHeight = areaHeight;
  const headOffset = ART_HEAD_HEIGHT * scaleY;
  const ready = game.status === 'ready';
  // Bahis kademesi: kademe atlayınca üstte kırmızı uyarı çıkar.
  const tier = tierOfBet(game.bet, game.lines);

  const handleSpin = () => {
    if (sound) {
      unlockAudio();
      eliminSound.spin();
    }
    game.spin();
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slot">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#3b1466_0%,#140a33_45%,#05040f_100%)]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_80%,#c026d3_0%,transparent_40%),radial-gradient(circle_at_80%_70%,#f59e0b_0%,transparent_35%)]" />
      </div>

      {/* Üst: SLOT FRENZY kemeri, kazananlar panosu, sandık/kupon ve 5'li Jackpot konsolu */}
      <SlotFrenzyHeader
        pools={game.pools}
        sound={sound}
        compact={inRoom}
        onHelp={() => setHelpOpen(true)}
        onSound={() => setSound((prev) => !prev)}
      />

      {/* Oyun ekranı: görselin kırpılan iki paneli arasında kalan kısım alta yaslanır. */}
      <div ref={areaRef} className="relative flex min-h-0 flex-1 items-end justify-center overflow-hidden">
        {width > 0 && (
          <div className="relative overflow-hidden" style={{ width, height: viewHeight }}>
            <div className="absolute inset-x-0" style={{ height, top: -headOffset }}>
              {/* Altın çerçeveli makara paneli: makara penceresini tam sarar, üstte boşluk kalmaz. */}
              <div
                className="absolute rounded-[18px] border-[5px] border-amber-400 bg-[linear-gradient(180deg,#1e0b3d,#0b0620)] shadow-[0_0_34px_rgba(245,158,11,0.6),inset_0_0_0_2px_rgba(253,230,138,0.75),inset_0_0_26px_rgba(192,38,211,0.5)]"
                style={{ left: '1.6%', width: '96.8%', top: '33.4%', height: '44.9%' }}
              />

              {/* Tur sırasında her makaranın sembolleri değişerek aşağı doğru kayar. */}
              <SlotReels spinning={game.spinning} stopping={game.stopping} slow={game.slow} grid={game.grid} wins={game.wins} />

              {/* Kazanan semboller ve aralarından geçen kazanç çizgileri — yeni tur başlayana kadar ekranda kalır. */}
              {!game.spinning && <SlotWinLines wins={game.wins} />}

              {game.status === 'loading' && (
                <p className="absolute inset-x-0 top-[62%] -translate-y-1/2 text-center text-xs font-bold text-white/80">
                  Oyun yükleniyor...
                </p>
              )}

              {/* Kazanç tutarı: tur bitince kaybolmaz, sonraki çevirmeye kadar görünür kalır. */}
              {(flash || game.win) > 0 && !game.spinning && !prize && (
                <p
                  key={flash || game.win}
                  className="game-win-float pointer-events-none absolute left-1/2 top-[54%] z-10 rounded-full border border-slot-gold/60 bg-black/70 px-3 py-1 font-mono text-sm font-black text-slot-gold"
                >
                  WIN {format(flash || game.win)}
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

        <SlotTierAlert tier={tier} top={BADGE_TOP} />
      </div>

      {/* Alt kontrol paneli */}
      <SlotControlDeck
        coins={game.coins}
        bet={game.bet}
        lines={game.lines}
        win={game.win}
        freeSpins={game.freeSpins}
        auto={game.auto}
        spinning={game.spinning}
        ready={ready}
        onStep={game.changeBet}
        onMax={game.maxBet}
        onAuto={game.toggleAuto}
        onSpin={handleSpin}
        onStop={game.stop}
        onCoins={() => setCoinOpen(true)}
      />

      <SlotWinOverlay
        open={!!prize}
        jackpot={!!prize?.jackpot}
        amount={prize?.amount || 0}
        winner={user?.username || ''}
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