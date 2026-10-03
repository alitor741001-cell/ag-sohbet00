import React, { useState } from 'react';
import { Gamepad2, Play, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAME_COVER } from './slotAssets';
import SlotGame from './SlotGame';

/** Oyun merkezi: sohbet alanındaki kumanda butonuyla açılan ayrı panel. */
export default function GamePanel({ open, onClose, roomId }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-[185] flex w-full flex-col bg-slot text-slot-text shadow-2xl sm:w-[30rem] sm:border-l sm:border-slot-border">
      {!selected && (
        <>
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
            <button
              type="button"
              onClick={() => setSelected('slot-frenzy')}
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
          </div>
        </>
      )}

      {selected && <SlotGame onExit={onClose} onBack={() => setSelected(null)} roomId={roomId} />}
    </div>
  );
}