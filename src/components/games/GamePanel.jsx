import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Play, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAME_COVER } from './slotAssets';
import { ROCKET_COVER } from './rocketAssets';
import SlotGame from './SlotGame';
import CrashRocketGame from './CrashRocketGame';
import LuckyOlympusGame from './LuckyOlympusGame';
import { LUCKY_OLYMPUS_COVER, LUCKY_OLYMPUS_COVER_W, LUCKY_OLYMPUS_COVER_H } from './luckyOlympusAssets';

// Sinematik geçişin toplam süresi.
const TRANSITION_MS = 700;
const SLOT_ID = 'slot-frenzy';
const ROCKET_ID = 'crash-rocket';
const LUCKY_ID = 'lucky-olympus';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
// Yeni oyun kartı kendi tanıtım görseliyle birebir durur: altına şerit konmaz.
const GAMES = [
  { id: LUCKY_ID, title: 'LUCKY OLYMPUS', cover: LUCKY_OLYMPUS_COVER, originWidth: LUCKY_OLYMPUS_COVER_W, originHeight: LUCKY_OLYMPUS_COVER_H, plain: true },
  { id: SLOT_ID, title: 'SLOT FRENZY', cover: GAME_COVER, originWidth: 1058, originHeight: 1008 },
  { id: ROCKET_ID, title: 'CRASH ROCKET', cover: ROCKET_COVER, originWidth: 1135, originHeight: 928 },
];

/** Oyun merkezi: sohbet alanındaki kumanda butonuyla açılan ayrı panel. */
export default function GamePanel({ open, onClose, roomId }) {
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'opening' | 'closing'
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const openGame = useCallback((gameId) => {
    window.clearTimeout(timerRef.current);
    setSelected(gameId);
    setPhase('opening');
    timerRef.current = window.setTimeout(() => setPhase('idle'), TRANSITION_MS);
  }, []);

  const closeGame = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setPhase('closing');
    timerRef.current = window.setTimeout(() => {
      setSelected(null);
      setPhase('idle');
    }, TRANSITION_MS);
  }, []);

  if (!open) return null;

  const transitioning = phase !== 'idle';

  return (
    <div className="absolute inset-y-0 right-0 z-[185] flex w-full flex-col overflow-hidden bg-slot text-slot-text shadow-2xl sm:w-[30rem] sm:border-l sm:border-slot-border">
      <div className="relative min-h-0 flex-1">
        {(!selected || transitioning) && (
          <div className={`game-layer ${phase === 'opening' ? 'game-dip' : phase === 'closing' ? 'game-rise' : ''}`}>
            <header className="flex shrink-0 items-center gap-2 border-b border-slot-border bg-slot-surface px-3 py-2.5">
              <Gamepad2 className="h-5 w-5 text-slot-gold" />
              <p className="min-w-0 flex-1 truncate text-sm font-black tracking-wide">Oyun Merkezi</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Oyun panelini kapat"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slot-panel"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Panelde sadece oyunun logosu durur: dokununca oyun açılır. */}
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto p-3">
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
                    className="w-full"
                    fittingType="fill"
                    originWidth={game.originWidth}
                    originHeight={game.originHeight}
                    quality={92}
                  />
                  {!game.plain && (
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-3 py-2">
                      <span className="text-xs font-black tracking-wide text-slot-gold">{game.title}</span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-white">
                        <Play className="h-3 w-3" /> OYNA
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className={`game-layer bg-slot ${phase === 'opening' ? 'game-zoom-in' : phase === 'closing' ? 'game-zoom-out' : ''}`}>
            {selected === ROCKET_ID ? (
              <CrashRocketGame onExit={onClose} onBack={closeGame} />
            ) : selected === LUCKY_ID ? (
              <LuckyOlympusGame onBack={closeGame} />
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