import React from 'react';
import { Gavel } from 'lucide-react';

/** Oylama paneli: oy masadaki kişiye dokunarak verilir; burada durum ve önceki oylama görünür. */
export default function MafyaVotePanel({ room, me }) {
  const alive = (room.players || []).filter((player) => player.alive !== false);
  const pending = alive.filter((player) => !player.voted).length;

  return (
    <div className="mf-panel">
      <p className="mf-panel-title">
        <Gavel className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> OYLAMA BAŞLADI
      </p>
      <p className="mf-panel-text">
        {me.voted ? 'Oyun kaydedildi. ' : 'Masada göndermek istediğin kişiye dokun. '}
        {pending ? `${pending} oyuncu henüz oy vermedi.` : 'Bütün oylar verildi.'}
      </p>
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