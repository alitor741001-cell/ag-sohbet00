import React from 'react';
import { Gavel } from 'lucide-react';
import { Image } from '@/components/ui/image';

/** Oylama: hayatta olan oyunculardan birine oy verilir; gönderilen oyuncu aşama sonunda açıklanır. */
export default function MafyaVotePanel({ room, me, busy, onVote }) {
  const alive = (room.players || []).filter((player) => player.alive !== false);
  const targets = alive.filter((player) => player.user_id !== me.user_id);
  const pending = alive.filter((player) => !player.voted).length;

  return (
    <div className="mf-panel">
      <p className="mf-panel-title">
        <Gavel className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> OYLAMA BAŞLADI! Kimi gönderelim?
      </p>
      <p className="mf-panel-text">
        {pending ? `${pending} oyuncu henüz oy vermedi.` : 'Bütün oylar verildi.'}
        {me.voted ? ' Oyun kaydedildi.' : ''}
      </p>
      <div className="mf-targets">
        {targets.map((player) => (
          <button
            key={player.user_id}
            type="button"
            disabled={busy || !me.alive}
            className="mf-target"
            onClick={() => onVote(player.user_id)}
          >
            <span className="mf-seat-avatar">
              {player.avatar ? (
                <Image src={player.avatar} alt="" className="h-full w-full" fittingType="fill" quality={70} />
              ) : (
                <span className="mf-seat-initial">{(player.name || 'O').slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <span className="mf-target-name">{player.name}</span>
          </button>
        ))}
      </div>
      {room.last_votes?.length ? (
        <>
          <p className="mf-panel-title">ÖNCEKİ OYLAMA</p>
          <div className="mf-votes">
            {room.last_votes.map((row) => (
              <span className="mf-vote-row" key={row.target_id}>{row.target_name} · {row.count} oy</span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}