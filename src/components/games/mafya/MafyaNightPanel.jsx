import React from 'react';
import { Image } from '@/components/ui/image';
import { ROLE_MAP } from './mafyaConfig';

/** Gece paneli: rolünün aksiyonu hedefe dokunarak seçilir; istihbarat notları altta listelenir. */
export default function MafyaNightPanel({ room, me, busy, onAct, onSkip }) {
  const info = ROLE_MAP[me.role] || null;
  const alive = (room.players || []).filter((player) => player.alive !== false);
  const targets = alive.filter((player) => me.role === 'doktor' || player.user_id !== me.user_id);

  return (
    <div className="mf-panel">
      <p className="mf-panel-title">
        {info ? `${info.name} · ${info.action || 'GECE'}` : 'GECE'}
        {me.ready ? ' · HAZIR' : ''}
      </p>

      {info?.action ? (
        <>
          <p className="mf-panel-text">{info.duty} Hedefine dokun.</p>
          <div className="mf-targets">
            {targets.map((player) => (
              <button
                key={player.user_id}
                type="button"
                disabled={busy}
                className={`mf-target${me.my_action === player.user_id ? ' mf-target-on' : ''}`}
                onClick={() => onAct(player.user_id)}
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
          {me.my_action ? <p className="mf-panel-text">Aksiyonun kaydedildi. Diğer oyuncular bekleniyor.</p> : null}
        </>
      ) : (
        <>
          <p className="mf-panel-text">
            Gece gücün yok: şehir uyurken sen de dinlen. Gündüz tartışmada sesini çıkar, doğru kişiyi oyla.
          </p>
          <button type="button" className="mf-btn mf-btn-gold" disabled={busy || me.ready} onClick={onSkip}>
            {me.ready ? 'GECE HAZIR' : 'GECEYİ GEÇ'}
          </button>
        </>
      )}

      {me.teammates?.length ? (
        <p className="mf-panel-text">
          Karanlık taraf: {me.teammates.map((mate) => `${mate.name} (${ROLE_MAP[mate.role]?.name || mate.role})`).join(', ')}
        </p>
      ) : null}

      {me.notes?.length ? (
        <>
          <p className="mf-panel-title">İSTİHBARAT</p>
          <div className="mf-notes">
            {me.notes.map((note) => (
              <p className="mf-note" key={`${note.round_no}-${note.text}`}>{note.text}</p>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}