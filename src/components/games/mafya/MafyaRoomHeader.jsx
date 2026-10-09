import React from 'react';
import { LogOut } from 'lucide-react';
import { PHASE_LABEL, PHASE_MS } from './mafyaConfig';
import { useMafyaCountdown } from './useMafyaGame';

/** Oda üst şeridi: oda bilgisi, aşama, geri sayım ve son olay. */
export default function MafyaRoomHeader({ room, onLeave }) {
  const left = useMafyaCountdown(room.phase_ends_at);
  const total = PHASE_MS[room.status] || 0;
  const progress = total ? Math.max(0, Math.min(100, Math.round((left * 1000 * 100) / total))) : 0;
  const live = room.status === 'night' || room.status === 'vote';

  return (
    <div className="mf-room-top">
      <div className="flex items-center gap-2">
        <span className="mf-room-status">ODA {room.code} · {room.name}</span>
        <button type="button" onClick={onLeave} className="ml-auto flex items-center gap-1 text-[0.58rem] font-black text-white/70">
          <LogOut className="h-3.5 w-3.5" /> ÇIK
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className={`mf-room-status${live ? ' mf-room-status-live' : ''}`}>
          {PHASE_LABEL[room.status] || ''}{room.round_no ? ` ${room.round_no}` : ''}
        </span>
        {left ? <span className="mf-timer-text ml-auto">{left} sn</span> : null}
      </div>
      {total > 0 ? (
        <span className="mf-timer">
          <span className="mf-timer-fill" style={{ width: `${progress}%` }} />
        </span>
      ) : null}
      {room.last_action ? <p className="mf-panel-text">{room.last_action}</p> : null}
    </div>
  );
}