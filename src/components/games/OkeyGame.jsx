import { useEffect, useMemo, useState } from 'react';
import { leftoverCount, planHand } from './okey/okeyGroups';
import '@/styles/okey.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import OkeyFelt from './okey/OkeyFelt';
import OkeyLobby from './okey/OkeyLobby';
import OkeyModeButtons from './okey/OkeyModeButtons';
import OkeyPlayerProfile from './okey/OkeyPlayerProfile';
import OkeyRack from './okey/OkeyRack';
import OkeyResultOverlay from './okey/OkeyResultOverlay';
import OkeyTopBar from './okey/OkeyTopBar';
import OkeyWaitRoom from './okey/OkeyWaitRoom';
import useOkeyGame from './okey/useOkeyGame';

/** OKEY: bahisli, dört kişilik okey masası.
    variant 'okey101' → 21 taş, 101 puan; variant 'okey' → 14 taş, klasik bitiş. */
export default function OkeyGame({ variant = 'okey101', onExit, onBack }) {
  const game = useOkeyGame(variant);
  const classic = variant === 'okey';
  const [coinOpen, setCoinOpen] = useState(false);
  // Tahta dizilimi: seri (renk sırası), çift (sayı sırası) ya da elle (parmakla sürüklenen).
  const [mode, setMode] = useState('seri');
  // Son seçilen dizilim: elle dizilişte de puan bu dizilime göre hesaplanır.
  const [arrange, setArrange] = useState('seri');
  // Dizilim tuşuna her basışta artar: tahta yeniden dizilir, taşların elle sırası bırakılır.
  const [sortKey, setSortKey] = useState(0);
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
  // 101 puanı bulan el: BİTİR yeşil yanar ve basınca el kendiliğinden biter.
  const canFinishNow = myTurn && game.canFinish;
  const turnName = table?.seats?.[table?.turn]?.name || 'Oyuncu';
  const filled = (table?.seats || []).filter((entry) => entry.user_id).length;
  // Grupların puanı: SERİ DİZ'de seriler ve sayı grupları, ÇİFTE DİZ'de ikiz taşlar sayılır;
  // hiçbir gruba girmeyen taşlar puanlanmaz ve tahtanın sonunda ayrı durur.
  const myScore = useMemo(
    () => planHand(game.hand, arrange, table?.okey).total,
    [game.hand, arrange, table?.okey],
  );
  // Klasik sürümde puan yok: elin bitişe kalan "fazla" taşları yazılır.
  const loose = useMemo(
    () => (classic ? leftoverCount(game.hand, arrange, table?.okey) : 0),
    [classic, game.hand, arrange, table?.okey],
  );
  const chipReady = classic ? game.canFinish : myScore >= 101;

  // Her yeni elde tahta yeniden dizilir: 21 (başlayanda 22) taş "seri" düzenine göre sıralanır.
  const roundNo = Number(table?.round_no) || 0;
  useEffect(() => {
    setMode('seri');
    setArrange('seri');
    setSortKey((value) => value + 1);
  }, [roundNo]);

  // Dizilim düğmeleri: SERİ/ÇİFT'e basıldığı an tahta yeniden dizilir ve puan o dizilime göre hesaplanır.
  const changeMode = (next) => {
    setMode(next);
    setArrange(next);
    setSortKey((value) => value + 1);
  };

  const statusText = waiting
    ? `2, 3 ya da 4 oyuncuyla başlayabilirsin (${filled}/4). 4 oyuncu dolunca oyun kendiliğinden başlar.`
    : playing
      ? myTurn
        ? game.canFinish
          ? classic
            ? 'Elin hazır — BİTİR ile eli bitir.'
            : 'Elin 101 puanı buldu — BİTİR ile eli bitir.'
          : phase === 'draw'
            ? 'Sıra sende: ortadaki desteye dokunup taş çek.'
            : classic
              ? 'Sıra sende: elinden bir taş at.'
              : `Sıra sende: elinden bir taş at. Grupların ${myScore} puan.`
        : `${turnName} oynuyor...`
      : table?.last_action || 'El kapandı.';

  return (
    <div className="okey-shell" data-variant={variant}>
      <OkeyTopBar
        variant={variant}
        table={table}
        coins={coins}
        onStore={() => setCoinOpen(true)}
        onBack={onBack}
        onExit={onExit}
      />

      {table ? (
        <OkeyFelt
          variant={variant}
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
            {/* Dizilim tuşları: AYRIL/BİTİR ile aynı şeritte durur. */}
            <OkeyModeButtons mode={mode} onMode={changeMode} />
            {/* 101 OKEY'de el puanı, klasikte bitişe kalan fazla taş sayısı yazılır. */}
            <span className="okey-score-chip" data-ready={chipReady ? '1' : '0'}>
              {classic
                ? (loose ? `${loose} TAŞ FAZLA` : 'EL HAZIR')
                : `${arrange === 'cift' ? 'ÇİFT' : 'SERİ'} · ${myScore} PUAN`}
            </span>
            <button
              type="button"
              className={`okey-btn okey-btn-green${canFinishNow ? ' okey-btn-ready' : ''}`}
              disabled={busy || !canFinishNow}
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
            variant={variant}
            hand={game.hand}
            drawnTile={canDiscard ? game.drawnTile : ''}
            okey={table.okey}
            mode={mode}
            sortKey={sortKey}
            canDiscard={canDiscard}
            onDiscard={game.actions.discard}
            busy={busy}
            onDropTarget={setDropActive}
          />
        )
      ) : (
        <OkeyLobby
          variant={variant}
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