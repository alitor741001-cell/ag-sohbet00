import React, { useState } from 'react';
import '@/styles/rocket.css';
import useRocketGame from './rocket/useRocketGame';
import RocketHeader from './rocket/RocketHeader';
import RocketStage from './rocket/RocketStage';
import RocketBetDock from './rocket/RocketBetDock';
import RocketLedger from './rocket/RocketLedger';

/**
 * Crash Rocket: görseldeki tasarımın kendisi canlı arayüz olarak kurulur.
 * Tüm butonlar gerçek; çarpan, roket uçuşu, oyuncular ve çekilen tutarlar
 * sunucudan gerçek zamanlı akar.
 */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const [ledgerOpen, setLedgerOpen] = useState(false);

  // Defter yalnızca açıldığında sunucudan istenir.
  const openLedger = () => {
    setLedgerOpen(true);
    game.loadLedger();
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0a0b1e]">
      <RocketHeader
        coins={game.coins}
        history={game.history}
        onBack={onBack}
        onExit={onExit}
        onLedger={openLedger}
      />
      <RocketStage game={game} />
      <RocketBetDock game={game} />

      <RocketLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)} data={game.ledger} />

      {(game.status === 'loading' || game.status === 'error') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0b1e]/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-[#5fc9ff]" />
        </div>
      )}

      {game.message && (
        <p className="absolute left-1/2 top-[12%] z-30 w-max max-w-[92%] -translate-x-1/2 rounded-full border border-[#facd15]/45 bg-[#0a0b1e]/90 px-3 py-1.5 text-center text-[11px] font-bold text-[#ffe082]">
          {game.message}
        </p>
      )}
    </div>
  );
}