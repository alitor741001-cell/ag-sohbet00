import React, { useState } from 'react';
import '@/styles/rocket.css';
import useRocketGame from './rocket/useRocketGame';
import RocketScreen from './rocket/RocketScreen';
import RocketLiveShip from './rocket/RocketLiveShip';
import RocketLiveBoard from './rocket/RocketLiveBoard';
import RocketLiveGauge from './rocket/RocketLiveGauge';
import RocketLiveHeader from './rocket/RocketLiveHeader';
import RocketLiveDock from './rocket/RocketLiveDock';
import RocketAutoDialog from './rocket/RocketAutoDialog';
import RocketLedger from './rocket/RocketLedger';
import RocketRulesSheet from './rocket/RocketRulesSheet';

/**
 * Crash Rocket: kullanıcının gönderdiği tasarım görseli birebir ekran zeminidir.
 * Canlı değerler görselin kendi ölçülerinde (828x1485) tam üstlerine yazılır,
 * tasarımdaki butonlar gerçek dokunma alanlarıyla çalışır.
 */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [autoEdit, setAutoEdit] = useState(null);

  const exit = onBack || onExit;
  const crashed = game.phase === 'crashed';
  const mult = game.phase === 'running' || crashed ? Math.max(1, game.displayMult) : 1;

  // Defter yalnızca açıldığında sunucudan istenir.
  const openLedger = () => {
    setLedgerOpen(true);
    game.loadLedger();
  };

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden bg-[#05060f] ${crashed ? 'rk-shake' : ''}`}>
      <RocketScreen>
        <RocketLiveShip phase={game.phase} mult={mult} />
        <RocketLiveBoard bets={game.bets} me={game.me} />
        <RocketLiveGauge
          phase={game.phase}
          mult={mult}
          countdown={game.countdown}
          countdownMs={game.countdownMs}
        />
        <RocketLiveHeader
          coins={game.coins}
          history={game.history}
          roundNo={game.round?.round_no || 0}
          onBack={exit}
          onLedger={openLedger}
          onHelp={() => setRulesOpen(true)}
        />
        <RocketLiveDock game={game} onAutoEdit={setAutoEdit} />
      </RocketScreen>

      <RocketAutoDialog
        open={autoEdit !== null}
        value={autoEdit === 2 ? game.auto2 : game.auto1}
        onSave={(value) => game.setAutoTarget(autoEdit, value)}
        onClose={() => setAutoEdit(null)}
      />

      <RocketLedger open={ledgerOpen} onClose={() => setLedgerOpen(false)} data={game.ledger} />
      <RocketRulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {(game.status === 'loading' || game.status === 'error') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05060f]/85">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-[#5fc9ff]" />
        </div>
      )}

      {game.message && (
        <p className="absolute left-1/2 top-[54%] z-30 w-max max-w-[92%] -translate-x-1/2 rounded-full border border-[#facd15]/45 bg-[#0a0b1e]/90 px-3 py-1.5 text-center text-[11px] font-bold text-[#ffe082]">
          {game.message}
        </p>
      )}
    </div>
  );
}