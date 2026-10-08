import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Play, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { DEDE_ID, ELIMIN_ID, FRUIT_ID, FUTBOL_ID, GAMES, ROCKET_ID, ROULETTE_ID, SEKERLI_MEYVE_ID, SEKER_ID } from './gameCatalog';
import FootballGame from './FootballGame';
import SekerliMeyveGame from './SekerliMeyveGame';
import SlotGame from './SlotGame';
import CrashRocketGame from './CrashRocketGame';
import FruitGame from './FruitGame';
import EliminSlotGame from './EliminSlotGame';
import DedeGame from './DedeGame';
import RouletteGame from './RouletteGame';
import SekerGame from './SekerGame';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';
import useBackDismiss from '@/hooks/useBackDismiss';

// Sinematik geçişin toplam süresi.
const TRANSITION_MS = 700;

/** Oyun merkezi: sohbet alanındaki kumanda butonuyla açılan ayrı panel.
    initialGame verilirse panel listeyi atlayıp oyunu doğrudan tam ekran açar. */
export default function GamePanel({ open, onClose, roomId, initialGame = null }) {
  const { user } = useCurrentUser();
  const [selected, setSelected] = useState(initialGame);
  const [phase, setPhase] = useState(initialGame ? 'opening' : 'idle'); // 'opening' | 'closing'

  // Oyun paneli de birleşik geri yığınında: geri tuşu önce oyunu kapatır.
  useBackDismiss(open, onClose);
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

  if (!open) return null;
  // Oyun merkezi yalnızca yayıncı/ajans üyesi hesaplara açıktır.
  if (!broadcasterState(user).games) return null;

  const transitioning = phase !== 'idle';

  // Oyun merkezi yarım panel olarak açılır; oyun seçilince tüm ekrana yayılır.
  const full = !!selected;

  return (
    <div className="fixed inset-0 z-[185] flex flex-col justify-end">
      {!full && (
        <button type="button" aria-label="Oyun panelini kapat" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      )}
      <div
        className={
          full
            ? 'relative flex h-full w-full flex-col overflow-hidden bg-slot text-slot-text'
            : 'animate-sheet-up relative flex h-[60dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2C1512] to-[#150A0A] text-slot-text ring-1 ring-[#F2CE6B]/40'
        }
      >
        {(!selected || transitioning) && (
          <div className={`game-layer ${phase === 'opening' ? 'game-dip' : phase === 'closing' ? 'game-rise' : ''}`}>
            {!full && <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#F2CE6B]/60" />}
            <header className="flex shrink-0 items-center gap-2 border-b border-[#F2CE6B]/25 px-3 pb-2.5 pt-2">
              <Gamepad2 className="h-5 w-5 text-[#F2CE6B]" />
              <p className="min-w-0 flex-1 truncate text-sm font-black tracking-wide text-[#F2CE6B]">Oyun Merkezi</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Oyun panelini kapat"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slot-panel"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Panelde sadece oyunun logosu durur: dokununca oyun açılır.
                Kartlar alt alta değil, eşit genişlikte yan yana durur. */}
            <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-3 overflow-y-auto p-3">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => openGame(game.id)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-slot-gold/40 active:scale-[0.99]"
                >
                  <Image
                    src={game.cover}
                    alt={game.title}
                    className="aspect-square w-full"
                    fittingType="fit"
                    originWidth={game.originWidth}
                    originHeight={game.originHeight}
                    quality={92}
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 bg-black/70 px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[11px] font-black tracking-wide text-slot-gold">{game.title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-black text-white">
                      <Play className="h-3 w-3" /> OYNA
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className={`game-layer bg-slot ${phase === 'opening' ? 'game-zoom-in' : phase === 'closing' ? 'game-zoom-out' : ''}`}>
            {selected === SEKERLI_MEYVE_ID ? (
              <SekerliMeyveGame onExit={onClose} onBack={closeGame} />
            ) : selected === FUTBOL_ID ? (
              <FootballGame onExit={onClose} onBack={closeGame} />
            ) : selected === DEDE_ID ? (
              <DedeGame onExit={onClose} onBack={closeGame} />
            ) : selected === ROCKET_ID ? (
              <CrashRocketGame onExit={onClose} onBack={closeGame} />
            ) : selected === FRUIT_ID ? (
              <FruitGame onExit={onClose} onBack={closeGame} />
            ) : selected === ELIMIN_ID ? (
              <EliminSlotGame onExit={onClose} onBack={closeGame} />
            ) : selected === ROULETTE_ID ? (
              <RouletteGame onExit={onClose} onBack={closeGame} />
            ) : selected === SEKER_ID ? (
              <SekerGame onExit={onClose} onBack={closeGame} />
            ) : (
              <SlotGame onExit={onClose} onBack={closeGame} roomId={roomId} />
            )}
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