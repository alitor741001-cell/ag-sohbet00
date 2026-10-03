import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { SLOT_ART } from './slotAssets';
import { ART_HEIGHT, ART_WIDTH, SLOT_LAYOUT } from './slot/slotLayout';
import useSlotGame from './slot/useSlotGame';
import SlotReels from './slot/SlotReels';
import SlotWinLines from './slot/SlotWinLines';
import SlotReadout from './slot/SlotReadout';
import SlotWinOverlay from './slot/SlotWinOverlay';
import CoinSheet from './slot/CoinSheet';
import WinnerTicker from './slot/WinnerTicker';
import SlotStopButton from './slot/SlotStopButton';

// Görsel alanı doldururken en fazla bu oranda kırpılır; panelde siyah boşluk kalmaz.
const MAX_CROP = 1.06;
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
  const size = useSize(frameRef);

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
  const scale = Math.min(cover || 0, (fit || 0) * MAX_CROP);
  const width = ART_WIDTH * scale;
  const height = ART_HEIGHT * scale;
  // Şerit, görselin üstünde kalan boşluğu kaplar ve orada biter — filmkeyfi yazısını kapatmaz.
  const tickerHeight = Math.max(26, Math.round((panelHeight || 0) - height));
  const ready = game.status === 'ready';

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
              alt="filmkeyfi slot"
              className="absolute inset-0 h-full w-full"
              fittingType="fill"
              quality={92}
            />

            {/* Tur sırasında her makaranın sembolleri değişerek aşağı doğru kayar. */}
            <SlotReels spinning={game.spinning} stopping={game.stopping} slow={game.slow} grid={game.grid} />

            {/* Kazanan semboller ve aralarından geçen kazanç çizgileri — yeni tur başlayana kadar ekranda kalır. */}
            {!game.spinning && <SlotWinLines wins={game.wins} />}

            {/* Görselin kendi rakam alanları: bakiye, WIN, BET, LINES, TOTAL BET ve üst ödüller */}
            <SlotReadout coins={game.coins} win={game.win} bet={game.bet} lines={game.lines} grand={game.grand} />

            {/* Görselin kendi butonları — görünmez dokunma alanları */}
            <button
              type="button"
              onClick={game.spinning ? game.stop : game.spin}
              disabled={!ready || game.stopping || game.stopRequested}
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
                className="game-win-float pointer-events-none absolute left-1/2 top-[62%] z-10 rounded-full border border-slot-gold/60 bg-black/70 px-4 py-1.5 font-mono text-lg font-black text-slot-gold"
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
      <div className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
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

      <SlotWinOverlay
        open={!!prize}
        jackpot={!!prize?.jackpot}
        amount={prize?.amount || 0}
        winner={user?.full_name || user?.username || ''}
        onAccept={() => setPrize(null)}
      />

      <CoinSheet
        open={coinOpen}
        onClose={() => setCoinOpen(false)}
        coins={game.coins}
        bonusReady={game.bonusReady}
        bonusAmount={game.bonusAmount}
        message={game.message}
        onClaim={game.claimBonus}
      />
    </div>
  );
}