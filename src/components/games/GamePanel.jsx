import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Play, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAME_COVER } from './slotAssets';
import SlotGame from './SlotGame';
import BigWinBoard from './BigWinBoard';
import WinnerBoard from './WinnerBoard';
import WinHistory from './WinHistory';

// Sinematik geçişin toplam süresi.
const TRANSITION_MS = 700;
const GAME_ID = 'slot-frenzy';

/** Oyun merkezi: sohbet alanındaki kumanda butonuyla açılan ayrı panel. */
export default function GamePanel({ open, onClose, roomId }) {
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'opening' | 'closing'
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const openGame = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setSelected(GAME_ID);
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

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <BigWinBoard />
              <WinnerBoard />
              <button
                type="button"
                onClick={openGame}
                className="group relative block w-full overflow-hidden rounded-2xl border border-slot-gold/40 active:scale-[0.99]"
              >
                <Image
                  src={GAME_COVER}
                  alt="Slot Frenzy Grand Win"
                  className="w-full"
                  fittingType="fill"
                  originWidth={1058}
                  originHeight={1008}
                  quality={92}
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/70 px-3 py-2">
                  <span className="text-xs font-black tracking-wide text-slot-gold">SLOT FRENZY</span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-white">
                    <Play className="h-3 w-3" /> OYNA
                  </span>
                </span>
              </button>
              <WinHistory />
            </div>
          </div>
        )}

        {selected && (
          <div className={`game-layer bg-slot ${phase === 'opening' ? 'game-zoom-in' : phase === 'closing' ? 'game-zoom-out' : ''}`}>
            <SlotGame onExit={onClose} onBack={closeGame} roomId={roomId} />
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