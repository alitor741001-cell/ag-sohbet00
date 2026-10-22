import React, { useState } from 'react';
import '@/styles/aviator.css';
import useRocketGame from './rocket/useRocketGame';
import RocketLedger from './rocket/RocketLedger';
import RocketAutoDialog from './rocket/RocketAutoDialog';
import AviatorHeader from './aviator/AviatorHeader';
import AviatorHistory from './aviator/AviatorHistory';
import AviatorPlayers from './aviator/AviatorPlayers';
import AviatorStage from './aviator/AviatorStage';
import AviatorBetCard from './aviator/AviatorBetCard';
import betSlot from './aviator/useBetSlot';
import GameHelpSheet from './help/GameHelpSheet';

/** Aviator: uçak havalanır, çarpan yükselir; uçak uçup gitmeden önce çek. */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame('rocket');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoEdit, setAutoEdit] = useState(null);

  return (
    <div className="av-game relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <AviatorHeader coins={game.coins} onBack={onBack} onExit={onExit}
        onLedger={() => { setLedgerOpen(true); game.loadLedger(); }} onHelp={() => setHelpOpen(true)} />
      <div className="pt-2"><AviatorHistory history={game.history} /></div>

      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <AviatorPlayers bets={game.bets} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <AviatorStage game={game} />
          <div className="flex shrink-0 gap-2">
            <AviatorBetCard color="red" slot={betSlot(game, 1)} onAutoEdit={() => setAutoEdit(1)} />
            <AviatorBetCard color="green" slot={betSlot(game, 2)} onAutoEdit={() => setAutoEdit(2)} />
          </div>
        </div>
      </div>

      <RocketAutoDialog open={autoEdit !== null} value={autoEdit === 2 ? game.auto2 : game.auto1}
        onSave={(v) => game.setAutoTarget(autoEdit, v)} onClose={() => setAutoEdit(null)} />
      <RocketLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)} data={game.ledger} />
      <GameHelpSheet game="rocket" open={helpOpen} onClose={() => setHelpOpen(false)} />

      {(game.status === 'loading' || game.status === 'error') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-red-500" />
        </div>
      )}
      {game.message && (
        <p className="absolute left-1/2 top-[14%] z-30 w-max max-w-[92%] -translate-x-1/2 rounded-full border border-red-500/50 bg-black/90 px-3 py-1.5 text-[11px] font-bold text-red-300">{game.message}</p>
      )}
    </div>
  );
}