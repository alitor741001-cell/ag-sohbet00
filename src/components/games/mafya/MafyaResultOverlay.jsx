import React from 'react';
import MafyaRoleIcon from './MafyaRoleIcon';
import { roleOf, sideLabel } from './mafyaConfig';

/** Oyun sonu: kazanan taraf ve bütün roller açıklanır. */
export default function MafyaResultOverlay({ room, me, busy, onRestart, onLeave }) {
  const players = room.players || [];
  return (
    <div className="mf-overlay">
      <div className="mf-modal">
        <p className="mf-modal-title">OYUN BİTTİ</p>
        <p className="mf-result-side">
          {room.winner_side ? `${sideLabel(room.winner_side)} KAZANDI` : 'OYUN SONA ERDİ'}
        </p>
        {me.role ? <p className="mf-modal-text">Senin rolün: {roleOf(me.role)?.name || me.role}</p> : null}
        <div className="mf-result-roles">
          {players.map((player) => {
            const info = roleOf(player.role);
            return (
              <div className="mf-result-row" key={player.user_id}>
                <MafyaRoleIcon role={player.role} className="h-4 w-4" />
                <span className="mf-panel-text min-w-0 flex-1 truncate">{player.name}</span>
                <span className="mf-result-role" style={{ color: info?.tone || '#ffffff' }}>
                  {info?.name || '—'}
                </span>
                {player.alive === false ? <span className="mf-seat-tag mf-seat-tag-dead">ÖLDÜ</span> : null}
              </div>
            );
          })}
        </div>
        <div className="mf-actions">
          {me.is_host ? (
            <button type="button" className="mf-btn mf-btn-gold" disabled={busy} onClick={onRestart}>
              YENİ TUR
            </button>
          ) : (
            <button type="button" className="mf-btn mf-btn-ghost" disabled>
              YENİ TURU ODA SAHİBİ BAŞLATIR
            </button>
          )}
          <button type="button" className="mf-btn mf-btn-red" onClick={onLeave}>
            ODADAN ÇIK
          </button>
        </div>
      </div>
    </div>
  );
}