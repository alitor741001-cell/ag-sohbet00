import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import MafyaDayPanel from './MafyaDayPanel';
import MafyaFinalOverlay from './MafyaFinalOverlay';
import MafyaNightPanel from './MafyaNightPanel';
import MafyaResultOverlay from './MafyaResultOverlay';
import MafyaRoleIcon from './MafyaRoleIcon';
import MafyaRoomHeader from './MafyaRoomHeader';
import MafyaSeatGrid from './MafyaSeatGrid';
import MafyaVotePanel from './MafyaVotePanel';
import { MAFYA_MIN_PLAYERS, ROLE_MAP, roleOf, sideLabel } from './mafyaConfig';

const FINAL_MS = 6000;

/** Oda ekranı: bekleme, rol gösterme, gece, gündüz, oylama ve sonuç aşamalarını yönetir. */
export default function MafyaRoomView({ game }) {
  const { room, me, chat, busy, act } = game;
  const [revealOpen, setRevealOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [finalSeen, setFinalSeen] = useState(false);
  const status = room.status;
  const players = room.players || [];
  const alive = players.filter((player) => player.alive !== false);
  const info = me?.role ? roleOf(me.role) : null;

  // Rol kartı her rol dağıtımı aşamasında yeniden açılır; yeni turda final yeniden oynar.
  useEffect(() => {
    if (status === 'reveal') setRevealOpen(true);
    if (status === 'waiting') {
      setRevealOpen(false);
      setFinalSeen(false);
    }
  }, [status]);

  // SON 4 ekranı oyun boyunca bir kez, kısa süreliğine görünür.
  useEffect(() => {
    if (!room.final_shown || finalSeen || alive.length !== 4) return undefined;
    setFinalOpen(true);
    const timer = setTimeout(() => {
      setFinalOpen(false);
      setFinalSeen(true);
    }, FINAL_MS);
    return () => clearTimeout(timer);
  }, [room.final_shown, finalSeen, alive.length]);

  const leave = () => {
    if (status !== 'waiting' && !window.confirm('Oyun sürüyor. Çıkarsan oyundan düşersin, emin misin?')) return;
    act({ action: 'leave', room_id: room.id });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MafyaRoomHeader room={room} onLeave={leave} />
      <MafyaSeatGrid players={players} meId={me?.user_id} hostId={room.host_id} showVotes={status === 'vote'} />

      {status === 'waiting' ? (
        <div className="mf-panel">
          <p className="mf-panel-title">BEKLEME ODASI · {players.length}/{room.capacity}</p>
          <p className="mf-panel-text">
            En az {MAFYA_MIN_PLAYERS} oyuncu gerekir; oda dolduğunda oyun kendiliğinden başlar. Arkadaşların{' '}
            <span className="mf-room-code">{room.code}</span> koduyla katılır.
          </p>
          {me?.is_host ? (
            <button
              type="button"
              className="mf-btn mf-btn-gold"
              disabled={busy || players.length < MAFYA_MIN_PLAYERS}
              onClick={() => act({ action: 'start', room_id: room.id })}
            >
              <Play className="h-4 w-4" /> OYUNU BAŞLAT
            </button>
          ) : (
            <p className="mf-panel-text">Oda sahibi oyunu başlatacak.</p>
          )}
          <p className="mf-panel-text">Roller gizli dağıtılır: kimse kimsenin rolünü görmez.</p>
        </div>
      ) : null}

      {status !== 'waiting' && status !== 'finished' ? (
        <>
          {status === 'night' ? (
            <MafyaNightPanel
              room={room}
              me={me}
              busy={busy}
              onAct={(targetId) => act({ action: 'night', room_id: room.id, target_id: targetId })}
              onSkip={() => act({ action: 'night', room_id: room.id })}
            />
          ) : null}
          {status === 'vote' ? (
            <MafyaVotePanel
              room={room}
              me={me}
              busy={busy}
              onVote={(targetId) => act({ action: 'vote', room_id: room.id, target_id: targetId })}
            />
          ) : null}
          <MafyaDayPanel chat={chat} me={me} busy={busy} onSend={(text) => act({ action: 'chat', room_id: room.id, text })} />
          {me && !me.alive ? (
            <p className="mf-panel-text text-center">Öldün: artık izleyicisin, tartışmayı takip edebilirsin.</p>
          ) : null}
        </>
      ) : null}

      {status === 'reveal' && revealOpen && info ? (
        <div className="mf-overlay">
          <div className="mf-modal">
            <p className="mf-modal-title">ROLÜN</p>
            <div className="mf-reveal-card" style={{ '--role-tone': info.tone, '--role-glow': info.glow }}>
              <MafyaRoleIcon role={info.id} className="mf-reveal-icon" />
              <p className="mf-reveal-name">{info.name}</p>
              <p className="mf-reveal-side">{sideLabel(info.side)}</p>
              <p className="mf-reveal-duty">{info.duty}</p>
              {me.teammates?.length ? (
                <div className="mf-team">
                  {me.teammates.map((mate) => (
                    <span className="mf-team-chip" key={mate.user_id}>
                      {mate.name} · {ROLE_MAP[mate.role]?.name || mate.role}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="mf-btn mf-btn-gold" onClick={() => setRevealOpen(false)}>
              TAMAM
            </button>
            <p className="mf-modal-text">Rolünü kimseye gösterme. Gece aksiyonun bir sonraki aşamada açılır.</p>
          </div>
        </div>
      ) : null}

      {finalOpen ? (
        <MafyaFinalOverlay
          alive={alive.map((player) => player.name)}
          onAccept={() => {
            setFinalOpen(false);
            setFinalSeen(true);
          }}
        />
      ) : null}

      {status === 'finished' ? (
        <MafyaResultOverlay
          room={room}
          me={me}
          busy={busy}
          onRestart={() => act({ action: 'start', room_id: room.id })}
          onLeave={leave}
        />
      ) : null}
    </div>
  );
}