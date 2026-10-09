import React from 'react';
import { Lock, LogIn, RotateCcw } from 'lucide-react';
import { MAFYA_MAX_PLAYERS } from './mafyaConfig';

/** Açık odalar: doluluk noktaları, oda kodu ve katılma düğmesi. */
export default function MafyaRoomList({ rooms, myRoomId, busy, onJoin, onReturn }) {
  if (!rooms.length) {
    return <p className="mf-empty">Şu an açık oda yok — hızlı oyunla ilk masayı sen kur.</p>;
  }
  return (
    <div className="mf-rooms">
      {rooms.map((room) => {
        const count = (room.players || []).length;
        const seats = room.capacity || MAFYA_MAX_PLAYERS;
        return (
          <div className="mf-room" key={room.id}>
            <span className="mf-room-dots">
              {Array.from({ length: seats }, (_, index) => (
                <span className="mf-room-dot" key={index} data-on={index < count ? '1' : '0'} />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mf-room-code">ODA {room.code}</span>
              <span className="mf-room-meta">
                {' '}
                · {room.name} · {count}/{seats} oyuncu{room.has_password ? ' · şifreli' : ''}
              </span>
            </span>
            {room.id === myRoomId ? (
              <button type="button" className="mf-btn mf-btn-ghost" disabled={busy} onClick={() => onReturn(room.id)}>
                <RotateCcw className="h-3.5 w-3.5" /> DÖN
              </button>
            ) : (
              <button type="button" className="mf-btn" disabled={busy} onClick={() => onJoin(room)}>
                {room.has_password ? <Lock className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />} KATIL
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}