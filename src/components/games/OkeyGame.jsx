import { useState } from 'react';
import '@/styles/okey.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import OkeyFelt from './okey/OkeyFelt';
import OkeyLobby from './okey/OkeyLobby';
import OkeyRack from './okey/OkeyRack';
import OkeyResultOverlay from './okey/OkeyResultOverlay';
import OkeyTopBar from './okey/OkeyTopBar';
import OkeyWaitRoom from './okey/OkeyWaitRoom';
import useOkeyGame from './okey/useOkeyGame';

/** 101 OKEY: bahisli, dört kişilik okey masası. */
export default function OkeyGame({ onExit, onBack }) {
  const game = useOkeyGame();
  const [coinOpen, setCoinOpen] = useState(false);
  // Tahta dizilimi: seri (renk sırası) ya da çift (sayı sırası).
  const [mode, setMode] = useState('seri');

  const { table, seat, coins, busy } = game;
  const playing = table?.status === 'playing';
  const waiting = table?.status === 'waiting';
  const myTurn = playing && Number(table?.turn) === seat;
  const phase = table?.phase;
  const canDiscard = myTurn && phase === 'discard';
  const turnName = table?.seats?.[table?.turn]?.name || 'Oyuncu';
  const filled = (table?.seats || []).filter((entry) => entry.user_id).length;

  const statusText = waiting
    ? `2, 3 ya da 4 oyuncuyla başlayabilirsin (${filled}/4). 4 oyuncu dolunca oyun kendiliğinden başlar.`
    : playing
      ? myTurn
        ? phase === 'draw'
          ? 'Sıra sende: ortadan bir taş çek.'
          : game.canFinish
            ? 'Elin bitiyor: BİTİR ile potu al ya da bir taş at.'
            : 'Sıra sende: elinden bir taş at.'
        : `${turnName} oynuyor...`
      : table?.last_action || 'El kapandı.';

  return (
    <div className="okey-shell">
      <OkeyTopBar
        table={table}
        coins={coins}
        onStore={() => setCoinOpen(true)}
        onBack={onBack}
        onExit={onExit}
      />

      {table ? <OkeyFelt table={table} mySeat={seat} /> : <div className="okey-felt" />}

      {table && playing ? (
        <div className="okey-strip">
          <p className="okey-strip-text">{statusText}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              className="okey-btn okey-btn-gold"
              disabled={busy || !myTurn || phase !== 'draw'}
              onClick={game.actions.draw}
            >
              ORTADAN ÇEK
            </button>
            <button
              type="button"
              className="okey-btn okey-btn-green"
              disabled={busy || !canDiscard || !game.canFinish}
              onClick={game.actions.finish}
            >
              BİTİR
            </button>
            <button type="button" className="okey-btn" disabled={busy} onClick={game.actions.leave}>
              AYRIL
            </button>
          </div>
        </div>
      ) : null}

      {table ? (
        waiting ? (
          <OkeyWaitRoom
            table={table}
            mySeat={seat}
            coins={coins}
            busy={busy}
            onStake={game.actions.setStake}
            onStart={game.actions.start}
            onLeave={game.actions.leave}
          />
        ) : (
          <OkeyRack
            hand={game.hand}
            okey={table.okey}
            mode={mode}
            onMode={setMode}
            canDiscard={canDiscard}
            onDiscard={game.actions.discard}
            busy={busy}
          />
        )
      ) : (
        <OkeyLobby
          coins={coins}
          lobby={game.lobby}
          loading={game.lobbyLoading}
          busy={busy}
          error={game.error}
          onQuick={game.actions.quickPlay}
          onJoin={game.actions.joinTable}
          onStore={() => setCoinOpen(true)}
        />
      )}

      {game.error && table ? <p className="okey-toast">{game.error}</p> : null}

      {table ? <OkeyResultOverlay table={table} mySeat={seat} onLeave={game.actions.leave} /> : null}

      <CoinPurchasePanel open={coinOpen} coins={coins} onBack={() => setCoinOpen(false)} />
    </div>
  );
}