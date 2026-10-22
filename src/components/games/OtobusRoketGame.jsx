import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import '@/styles/otobus.css';
import useRocketGame from './rocket/useRocketGame';
import OtobusHeader from './otobus/OtobusHeader';
import OtobusStage from './otobus/OtobusStage';
import OtobusBetDock from './otobus/OtobusBetDock';
import OtobusBoard from './otobus/OtobusBoard';
import GameHelpSheet from './help/GameHelpSheet';

/**
 * OTOBÜS ROKET: savana yolunda giden otobüsün çarpanını yakaladığın oyun.
 * Tur motoru, cüzdan ve ödeme kuralları sunucudan gerçek zamanlı akar; bu ekran
 * yalnızca o otobüs temasının arayüzüdür.
 */
export default function OtobusRoketGame({ onExit, onBack }) {
  const game = useRocketGame('otobus');
  const [boardTab, setBoardTab] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const openBoard = (tab) => setBoardTab(tab);

  return (
    <div className="ob-game relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <OtobusHeader
        coins={game.coins}
        onBoard={() => openBoard('all')}
        onHelp={() => setHelpOpen(true)}
      />
      <OtobusStage game={{ ...game, onOpenBoard: () => openBoard('general') }} />
      <OtobusBetDock game={game} />

      <OtobusBoard
        open={boardTab !== null}
        tab={boardTab || 'all'}
        onTab={setBoardTab}
        game={game}
        onClose={() => setBoardTab(null)}
      />
      <GameHelpSheet game="otobus-roket" open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Geri tuşu: alt tarafta, bahis panellerinin altında, kolay erişilebilir. */}
      <button
        type="button"
        onClick={onBack || onExit}
        aria-label="Oyun merkezine dön"
        className="ob-back-float"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-[11px] font-black tracking-wide">GERİ</span>
      </button>

      {(game.status === 'loading' || game.status === 'error') && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#050d09]/85">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-[#7fe0aa]" />
        </div>
      )}

      {game.message && (
        <p className="ob-message">{game.message}</p>
      )}
    </div>
  );
}