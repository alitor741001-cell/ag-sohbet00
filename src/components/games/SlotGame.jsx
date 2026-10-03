import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { SLOT_ART } from './slotAssets';
import { ART_HEIGHT, ART_WIDTH, SLOT_LAYOUT } from './slot/slotLayout';
import useSlotGame from './slot/useSlotGame';
import CoinSheet from './slot/CoinSheet';

const ART_RATIO = ART_WIDTH / ART_HEIGHT;
const WIN_FLASH_MS = 2400;

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotGame({ onExit, onBack, roomId }) {
  const game = useSlotGame({ roomId });
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const frameRef = useRef(null);
  const size = useSize(frameRef);

  // Büyük ödülde panel kapanır; kutlama oda sohbetinde görünür.
  useEffect(() => {
    if (game.bigWin > 0) onExit?.();
  }, [game.bigWin, onExit]);

  // Kazanç ekranda kısa süre parlar, sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!game.win) return undefined;
    setFlash(game.win);
    const timer = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [game.win]);

  // Görsel asla kırpılmaz: kutu görselin oranını korur ve paneli tamamen doldurur.
  const width = Math.min(size?.width || 0, (size?.height || 0) * ART_RATIO);
  const height = width / ART_RATIO;
  const ready = game.status === 'ready';

  return (
    <div ref={frameRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slot">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {width > 0 && (
          <div className="relative" style={{ width, height }}>
            <Image
              src={SLOT_ART.shell}
              alt="filmkeyfi slot"
              className="absolute inset-0 h-full w-full"
              fittingType="fill"
              quality={92}
            />

            {/* Tur sırasında makaralar görselin kendi üzerinde döner. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute overflow-hidden ${game.spinning ? 'slot-bg-roll' : ''}`}
              style={{
                ...SLOT_LAYOUT.reelWindow,
                backgroundImage: `url(${SLOT_ART.shell})`,
                backgroundSize: '105.2% 230.6%',
                backgroundPosition: '50% 50%',
              }}
            />

            {/* Görselin kendi butonları — görünmez dokunma alanları */}
            <button
              type="button"
              onClick={game.spin}
              disabled={!ready || game.spinning}
              aria-label="Turu başlat"
              className="absolute rounded-full active:brightness-125"
              style={SLOT_LAYOUT.spin}
            />
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

            <button
              type="button"
              onClick={onBack}
              aria-label="Oyun listesine dön"
              className="absolute left-[1.5%] top-[1%] flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onExit}
              aria-label="Oyunu kapat"
              className="absolute right-[1.5%] top-[1%] flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            {game.status === 'loading' && (
              <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs font-bold text-white/80">
                Oyun yükleniyor...
              </p>
            )}

            {flash > 0 && (
              <p
                key={flash}
                className="game-win-float pointer-events-none absolute left-1/2 top-[40%] z-10 rounded-full border border-slot-gold/60 bg-black/70 px-4 py-1.5 font-mono text-lg font-black text-slot-gold"
              >
                WIN {format(flash)}
              </p>
            )}

            {game.message && !coinOpen && (
              <p className="absolute left-1/2 top-[5%] z-10 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-center text-[11px] font-bold text-slot-gold">
                {game.message}
              </p>
            )}
          </div>
        )}
      </div>

      <CoinSheet
        open={coinOpen}
        onClose={() => setCoinOpen(false)}
        coins={game.coins}
        unlimited={game.unlimited}
        bonusReady={game.bonusReady}
        bonusAmount={game.bonusAmount}
        message={game.message}
        onClaim={game.claimBonus}
      />
    </div>
  );
}