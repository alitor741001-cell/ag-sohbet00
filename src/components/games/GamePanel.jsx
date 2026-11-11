import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Gamepad2, Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAMES } from '@/components/games/gameCatalog';
import GameContent from '@/components/games/GameContent';
import GameQuickNav from '@/components/games/GameQuickNav';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';
import useBackDismiss from '@/hooks/useBackDismiss';
import '@/styles/gameCards.css';

// Sinematik geçişin toplam süresi.
const TRANSITION_MS = 220;

/** Oyun merkezi: sohbet alanındaki kumanda butonuyla açılan ayrı panel.
    initialGame verilirse panel listeyi atlayıp oyunu doğrudan tam ekran açar. */
export default function GamePanel({ open, onClose, roomId, initialGame = null, fullList = false }) {
  const { user } = useCurrentUser();
  const [selected, setSelected] = useState(initialGame);
  const [phase, setPhase] = useState(initialGame ? 'opening' : 'idle'); // 'opening' | 'closing'

  // Oyun paneli de birleşik geri yığınında: geri tuşu önce oyunu kapatır.
  useBackDismiss(open, onClose);
  usePageScrollLock(open && broadcasterState(user).games);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // Doğrudan oyunla açılışta giriş geçişi oynar, sonra panel sakinleşir.
  useEffect(() => {
    if (!initialGame) return undefined;
    timerRef.current = window.setTimeout(() => setPhase('idle'), TRANSITION_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [initialGame]);

  // Panel kapandığında seçim sıfırlanır: yeniden açıldığında yarım panel görünür.
  useEffect(() => {
    if (open) return;
    window.clearTimeout(timerRef.current);
    setSelected(null);
    setPhase('idle');
  }, [open]);

  const openGame = useCallback((gameId) => {
    window.clearTimeout(timerRef.current);
    setSelected(gameId);
    setPhase('opening');
    timerRef.current = window.setTimeout(() => setPhase('idle'), TRANSITION_MS);
  }, []);

  // Oyundan geri: yarım panele dönmeden oyun merkezi tümüyle kapanır.
  const closeGame = useCallback(() => {
    window.clearTimeout(timerRef.current);
    onClose();
  }, [onClose]);

  // Oyun açıkken ana sayfanın alt menüsü gizlenir.
  useEffect(() => {
    document.body.classList.toggle('game-open', !!(open && selected));
    return () => document.body.classList.remove('game-open');
  }, [open, selected]);

  if (!open) return null;
  // Oyun merkezi yalnızca yayıncı/ajans üyesi hesaplara açıktır.
  if (!broadcasterState(user).games) return null;

  const transitioning = phase !== 'idle';

  // Oyun merkezi yarım panel olarak açılır; oyun seçilince (veya fullList ile) tüm ekrana yayılır.
  const full = !!selected || fullList;

  return (
    <div className="fixed inset-0 z-[185] flex flex-col justify-end">
      {!full && (
        <button type="button" aria-label="Oyun panelini kapat" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      )}
      <div
        className={
          full
            ? 'relative flex h-full w-full flex-col overflow-hidden bg-slot text-slot-text'
            /* Yükseklik önce eski cihazlar için vh, destekleyenlerde dvh ile ölçülür. */
            : 'animate-sheet-up relative flex h-[60vh] supports-[height:100dvh]:h-[60dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2C1512] to-[#150A0A] text-slot-text ring-1 ring-[#F2CE6B]/40'
        }
      >
        {(!selected || transitioning) && (
          <div className={`game-layer ${phase === 'opening' ? 'game-dip' : phase === 'closing' ? 'game-rise' : ''}`}>
            {!full && <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#F2CE6B]/60" />}
            <header className="flex shrink-0 items-center gap-2 border-b border-[#F2CE6B]/25 px-3 pb-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Geri dön"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slot-panel"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Gamepad2 className="h-5 w-5 text-[#F2CE6B]" />
              <p className="min-w-0 flex-1 truncate text-sm font-black tracking-wide text-[#F2CE6B]">Oyun Merkezi</p>
            </header>

            {/* Panelde sadece oyunun logosu durur: dokununca oyun açılır.
                Kartlar alt alta değil, eşit genişlikte yan yana durur. */}
            <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-5 overflow-y-auto p-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => openGame(game.id)}
                  className="group flex w-full flex-col items-center gap-1.5 active:scale-95"
                >
                  {/* Oyun logosu altın halkalı çemberin içinde durur. */}
                  <span className="game-orb relative block w-[86%] overflow-hidden rounded-full">
                    <Image
                      src={game.cover}
                      alt={game.title}
                      className="aspect-square media-box-square w-full rounded-full"
                      fittingType="fill"
                      originWidth={game.originWidth}
                      originHeight={game.originHeight}
                      quality={92}
                    />
                  </span>
                  <span className="flex w-full items-center justify-center gap-1 truncate text-[11px] font-black tracking-wide text-slot-gold">
                    <Play className="h-2.5 w-2.5 shrink-0 fill-current" />
                    <span className="truncate">{game.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className={`game-layer bg-slot ${phase === 'opening' ? 'game-zoom-in' : phase === 'closing' ? 'game-zoom-out' : ''}`}>
            <div className="flex h-full min-h-0 flex-col">
              <GameQuickNav selected={selected} onSelect={openGame} onBack={onClose} />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <GameContent key={selected} selected={selected} onExit={onClose} onBack={closeGame} roomId={roomId} />
              </div>
            </div>
          </div>
        )}

        {transitioning && (
          <>
            <div className="game-veil pointer-events-none absolute inset-0 z-40 bg-black" />
            <div className="game-glow pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_45%,hsl(var(--slot-gold)/0.3),transparent_62%)]" />
            <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
              <span className="game-sheen absolute -inset-y-8 left-0 w-1/3 bg-gradient-to-r from-transparent via-slot-gold/30 to-transparent blur-md" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}