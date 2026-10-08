import React, { useState } from 'react';
import '@/styles/rocket.css';
import useRocketGame from './rocket/useRocketGame';
import RocketHeader from './rocket/RocketHeader';
import RocketStatsBar from './rocket/RocketStatsBar';
import RocketStage from './rocket/RocketStage';
import RocketBetDock from './rocket/RocketBetDock';
import RocketLedger from './rocket/RocketLedger';
import GameHelpSheet from './help/GameHelpSheet';

/**
 * Crash Rocket: görseldeki tasarımın kendisi canlı arayüz olarak kurulur.
 * Tüm butonlar gerçek; çarpan, roket uçuşu, oyuncular ve çekilen tutarlar
 * sunucudan gerçek zamanlı akar.
 */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Defter yalnızca açıldığında sunucudan istenir.
  const openLedger = () => {
    setLedgerOpen(true);
    game.loadLedger();
  };

  return (
    <div className="rk-game relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <RocketHeader
        onBack={onBack}
        onExit={onExit}
        onLedger={openLedger}
        onHelp={() => setHelpOpen(true)}
      />
      <RocketStatsBar roundNo={game.round?.round_no} coins={game.coins} history={game.history} />
      <RocketStage game={game} />
      <RocketBetDock game={game} />

      <RocketLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)} data={game.ledger} />
      <GameHelpSheet game="rocket" open={helpOpen} onClose={() => setHelpOpen(false)} />

      {(game.status === 'loading' || game.status === 'error') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05070f]/85">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/12 border-t-[#7fe4ff]" />
        </div>
      )}

      {game.message && (
        <p className="absolute left-1/2 top-[12%] z-30 w-max max-w-[92%] -translate-x-1/2 rounded-full border border-[#ffb800]/45 bg-[#05070f]/92 px-3 py-1.5 text-center text-[11px] font-bold text-[#ffd35c] shadow-[0_0_18px_-4px_rgba(255,184,0,0.6)]">
          {game.message}
        </p>
      )}
    </div>
  );
}