import React, { useState } from 'react';
import '@/styles/otobus.css';
import useRocketGame from './rocket/useRocketGame';
import OtobusHeader from './otobus/OtobusHeader';
import OtobusHistoryBar from './otobus/OtobusHistoryBar';
import OtobusStage from './otobus/OtobusStage';
import OtobusBetDock from './otobus/OtobusBetDock';
import OtobusFooter from './otobus/OtobusFooter';
import OtobusBoard from './otobus/OtobusBoard';
import GameHelpSheet from './help/GameHelpSheet';

/**
 * OTOBÜS ROKET: savana yolunda giden otobüsün çarpanını yakaladığın oyun.
 * Tur motoru, cüzdan ve ödeme kuralları sunucudan gerçek zamanlı akar; bu ekran
 * yalnızca o otobüs temasının arayüzüdür.
 */
export default function OtobusRoketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const [boardTab, setBoardTab] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="ob-game relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <OtobusHeader
        coins={game.coins}
        onBack={onBack || onExit}
        onBoard={() => setBoardTab('all')}
        onHelp={() => setHelpOpen(true)}
      />
      <OtobusHistoryBar history={game.history} onOpen={() => setBoardTab('general')} />
      <OtobusStage game={game} />
      <OtobusBetDock game={game} />
      <OtobusFooter roundNo={game.round?.round_no} tab={boardTab} onTab={setBoardTab} />

      <OtobusBoard
        open={boardTab !== null}
        tab={boardTab || 'all'}
        onTab={setBoardTab}
        game={game}
        onClose={() => setBoardTab(null)}
      />
      <GameHelpSheet game="otobus-roket" open={helpOpen} onClose={() => setHelpOpen(false)} />

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