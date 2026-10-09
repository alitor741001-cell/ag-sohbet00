import { useEffect, useMemo, useState } from 'react';
import { arrangedScore } from './okey/okeyConfig';
import '@/styles/okey.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import OkeyFelt from './okey/OkeyFelt';
import OkeyLobby from './okey/OkeyLobby';
import OkeyPlayerProfile from './okey/OkeyPlayerProfile';
import OkeyRack from './okey/OkeyRack';
import OkeyResultOverlay from './okey/OkeyResultOverlay';
import OkeyTopBar from './okey/OkeyTopBar';
import OkeyWaitRoom from './okey/OkeyWaitRoom';
import useOkeyGame from './okey/useOkeyGame';

/** 101 OKEY: bahisli, dört kişilik okey masası. */
export default function OkeyGame({ onExit, onBack }) {
  const game = useOkeyGame();
  const [coinOpen, setCoinOpen] = useState(false);
  // Tahta dizilimi: seri (renk sırası), çift (sayı sırası) ya da elle (parmakla sürüklenen).
  const [mode, setMode] = useState('seri');
  // Son seçilen dizilim: elle dizilişte de puan bu dizilime göre hesaplanır.
  const [arrange, setArrange] = useState('seri');
  // Taş çuhaya sürüklenirken masada "ortaya at" uyarısı görünür.
  const [dropActive, setDropActive] = useState(false);
  // Masadaki bir oyuncuya dokununca açılan kart: özel sohbetteki profil kartının aynısı.
  const [profileSeat, setProfileSeat] = useState(null);

  const { table, seat, coins, busy } = game;
  const playing = table?.status === 'playing';
  const waiting = table?.status === 'waiting';
  const myTurn = playing && Number(table?.turn) === seat;
  const phase = table?.phase;
  const canDiscard = myTurn && phase === 'discard';
  const canDraw = myTurn && phase === 'draw' && !busy;
  const turnName = table?.seats?.[table?.turn]?.name || 'Oyuncu';
  const filled = (table?.seats || []).filter((entry) => entry.user_id).length;
  // Dizili taşların puanı: SERİ DİZ basınca seriler, ÇİFTE DİZ basınca çiftler hesaplanır;
  // hiçbir gruba girmeyen tek taşlar sayılmaz.
  const myScore = useMemo(
    () => arrangedScore(game.hand, arrange, table?.okey),
    [game.hand, arrange, table?.okey],
  );

  // Her yeni elde tahta yeniden dizilir: 21 (başlayanda 22) taş "seri" düzenine göre sıralanır.
  const roundNo = Number(table?.round_no) || 0;
  useEffect(() => {
    setMode('seri');
    setArrange('seri');
  }, [roundNo]);

  // Dizilim düğmeleri: SERİ/ÇİFT'e basıldığı an puan o dizilime göre yeniden hesaplanır.
  const changeMode = (next) => {
    setMode(next);
    if (next !== 'manual') setArrange(next);
  };

  const statusText = waiting
    ? `2, 3 ya da 4 oyuncuyla başlayabilirsin (${filled}/4). 4 oyuncu dolunca oyun kendiliğinden başlar.`
    : playing
      ? myTurn
        ? phase === 'draw'
          ? 'Sıra sende: ortadaki desteye dokunup taş çek.'
          : game.canFinish
            ? 'Elin bitmeye hazır — BİTİR ile bitir ya da bir taş at.'
            : `Sıra sende: elinden bir taş at. Dizili taşların ${myScore} puan.`
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

      {table ? (
        <OkeyFelt
          table={table}
          mySeat={seat}
          canDraw={canDraw}
          onDraw={game.actions.draw}
          dropActive={dropActive}
          onOpenProfile={setProfileSeat}
        />
      ) : (
        <div className="okey-felt" />
      )}

      {table && playing ? (
        <div className="okey-strip">
          <p className="okey-strip-text">{statusText}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {/* El puanı: sıra kimde olursa olsun görünür kalır, her taşta yeniden hesaplanır. */}
            <span className="okey-score-chip" data-ready={game.canFinish ? '1' : '0'}>
              {arrange === 'cift' ? 'ÇİFT' : 'SERİ'} · {myScore} PUAN
            </span>
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
            onOpenProfile={setProfileSeat}
          />
        ) : (
          <OkeyRack
            hand={game.hand}
            okey={table.okey}
            mode={mode}
            onMode={changeMode}
            canDiscard={canDiscard}
            onDiscard={game.actions.discard}
            busy={busy}
            onDropTarget={setDropActive}
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

      {profileSeat ? <OkeyPlayerProfile player={profileSeat} onClose={() => setProfileSeat(null)} /> : null}

      <CoinPurchasePanel open={coinOpen} coins={coins} onBack={() => setCoinOpen(false)} />
    </div>
  );
}