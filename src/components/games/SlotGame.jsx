import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { SLOT_ART } from './slotAssets';
import { ART_HEIGHT, ART_WIDTH, LOGO_TOP, SLOT_LAYOUT } from './slot/slotLayout';
import useSlotGame from './slot/useSlotGame';
import SlotReels from './slot/SlotReels';
import SlotWinLines from './slot/SlotWinLines';
import SlotReadout from './slot/SlotReadout';
import SlotWinOverlay from './slot/SlotWinOverlay';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import WinnerTicker, { TICKER_ROW_HEIGHT } from './slot/WinnerTicker';
import SlotStopButton from './slot/SlotStopButton';
import SlotPoolLabels from './slot/SlotPoolLabels';
import SlotTierAlert from './slot/SlotTierAlert';
import FreeSpinBadge from './slot/FreeSpinBadge';
import { tierOfBet } from './slot/slotConfig';

// Görsel alanı doldururken en fazla bu oranda kırpılır; panelde siyah boşluk kalmaz.
const MAX_CROP = 1.06;
// Şeritte her zaman görünen en az satır sayısı.
const MIN_TICKER_ROWS = 2;
const MIN_TICKER_SPACE = TICKER_ROW_HEIGHT * MIN_TICKER_ROWS;
const WIN_FLASH_MS = 2400;
// Bu tutarın üzerindeki kazançlarda kutlama ekranı açılır.
const PRIZE_THRESHOLD = 20000;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotGame({ onExit, onBack, roomId }) {
  const { user } = useCurrentUser();
  const game = useSlotGame({ roomId });
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const frameRef = useRef(null);
  const topRef = useRef(null);
  const size = useSize(frameRef);
  // Çentik/güvenli alan yüksekliği: şerit görselin üstündeki yazıyı kapatmasın.
  const [safeTop, setSafeTop] = useState(0);

  useEffect(() => {
    if (!topRef.current) return;
    setSafeTop(parseFloat(window.getComputedStyle(topRef.current).paddingTop) || 0);
  }, []);

  // Her turun sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    if (!game.spins) return undefined;
    if (game.win >= PRIZE_THRESHOLD) {
      setPrize({ amount: game.win, jackpot: game.jackpotHit });
      return undefined;
    }
    if (game.win > 0) {
      setFlash(game.win);
      const timer = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [game.spins]);

  // Panel boşluğa siyah bırakmaz: görsel alanı doldurur, en fazla %6 kırpılır.
  const panelWidth = size?.width || 0;
  const panelHeight = size?.height || 0;
  const fit = Math.min(panelWidth / ART_WIDTH, panelHeight / ART_HEIGHT);
  const cover = Math.max(panelWidth / ART_WIDTH, panelHeight / ART_HEIGHT);
  // Üstte kazanan şeridine ve çentiğe yer ayrılır: şerit görselin üstündeki yazıyı kapatmaz.
  const reserve = Math.max(0, (panelHeight || 0) - MIN_TICKER_SPACE - safeTop) / ((1 - LOGO_TOP) * ART_HEIGHT);
  const scale = Math.min(cover || 0, (fit || 0) * MAX_CROP, reserve || 0);
  const width = ART_WIDTH * scale;
  const height = ART_HEIGHT * scale;
  // Görselin üst kenarı: görselin içindeki yazılar buradan ölçülür.
  const artTop = Math.max(0, (panelHeight || 0) - height);
  // Şerit, başlığın hemen üstündeki altın çizgiye kadar iner.
  const goldLine = artTop + LOGO_TOP * height;
  const tickerHeight = Math.max(MIN_TICKER_SPACE, Math.round(goldLine - safeTop));
  // Şeridin bittiği yer: altındaki rozet bu altın çizginin altına hizalanır.
  const tickerBottom = safeTop + tickerHeight;
  // Yazının altındaki boş şerit: FREE rozeti ve kademe uyarısı buraya oturur.
  const badgeTop = artTop + Math.round(height * 0.105);
  const alertTop = badgeTop + (game.freeSpins > 0 ? 36 : 0);
  const ready = game.status === 'ready';
  // Bahis kademesi: kademe atlayınca üstte kırmızı uyarı çıkar.
  const tier = tierOfBet(game.bet, game.lines);

  return (
    <div ref={frameRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slot">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image src={SLOT_ART.shell} alt="" className="h-full w-full scale-125 blur-2xl" fittingType="fill" quality={25} />
        <div className="absolute inset-0 bg-slot/65" />
      </div>

      {/* Görsel alta yaslanır: alt tarafta boşluk ve siyahlık kalmaz. */}
      <div className="relative flex min-h-0 flex-1 items-end justify-center">
        {width > 0 && (
          <div className="relative" style={{ width, height }}>
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

            {/* Görselin kendi rakam alanları: bakiye, WIN, BET, LINES, TOTAL BET ve üst ödüller */}
            <SlotReadout coins={game.coins} win={game.win} bet={game.bet} lines={game.lines} pools={game.pools} />

            {/* Görselde yazan havuz adlarının üzerine yeni adlar yazılır. */}
            <SlotPoolLabels />

            {/* Görselin kendi butonları — görünmez dokunma alanları */}
            <button
              type="button"
              onClick={game.spinning ? game.stop : game.spin}
              disabled={!ready}
              aria-label={game.spinning ? 'Makaraları durdur' : 'Turu başlat'}
              className="absolute flex items-center justify-center active:brightness-125"
              style={SLOT_LAYOUT.spin}
            >
              {/* Durdurma, SPIN düğmesinin tam üstüne gelir: yalnızca rengi değişir, yana taşmaz. */}
              {game.spinning && <SlotStopButton />}
            </button>
            <button
              type="button"
              onClick={game.toggleAuto}
              disabled={!ready}
              aria-label="Otomatik tur"
              className={`absolute rounded-2xl ${game.auto ? 'ring-2 ring-slot-green' : ''}`}
              style={SLOT_LAYOUT.auto}
            />
            <button
              type="button"
              onClick={game.maxBet}
              disabled={!ready}
              aria-label="Maksimum bahis"
              className="absolute rounded-xl active:brightness-125"
              style={SLOT_LAYOUT.max}
            />
            <button
              type="button"
              onClick={() => setCoinOpen(true)}
              aria-label="Coin yükle"
              className="absolute rounded-full active:brightness-125"
              style={SLOT_LAYOUT.balance}
            />
            <button
              type="button"
              onClick={() => game.changeBet(-1)}
              disabled={game.spinning}
              aria-label="Bahsi azalt"
              className="absolute rounded-lg active:brightness-125"
              style={SLOT_LAYOUT.betMinus}
            />
            <button
              type="button"
              onClick={() => game.changeBet(1)}
              disabled={game.spinning}
              aria-label="Bahsi artır"
              className="absolute rounded-lg active:brightness-125"
              style={SLOT_LAYOUT.betPlus}
            />

            {game.status === 'loading' && (
              <p className="absolute inset-x-0 top-[62%] -translate-y-1/2 text-center text-xs font-bold text-white/80">
                Oyun yükleniyor...
              </p>
            )}

            {flash > 0 && !prize && (
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
        )}
      </div>

      {/* Üst şerit: kazanan akışı, görselin üstünde kalan alanı tamamen kaplar; tuşlar köşelerde. */}
      <div ref={topRef} className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
        <WinnerTicker height={tickerHeight} />
        <button
          type="button"
          onClick={onBack}
          aria-label="Oyun listesine dön"
          className="absolute left-2 top-[env(safe-area-inset-top)] mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="absolute right-2 top-[env(safe-area-inset-top)] mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <FreeSpinBadge count={game.freeSpins} top={badgeTop} />

      <SlotTierAlert tier={tier} top={alertTop} />

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
    </div>
  );
}