import React from 'react';
import { Moon } from 'lucide-react';
import { ROLE_MAP } from './mafyaConfig';

/** Gece paneli: hedef masada seçilir. Burada rol bilgisi, istihbarat ve "geceyi geç" durur. */
export default function MafyaNightPanel({ me, busy, onSkip }) {
  const info = ROLE_MAP[me.role] || null;

  return (
    <div className="mf-panel">
      <p className="mf-panel-title">
        {info ? `${info.name} · ${info.action || 'GECE'}` : 'GECE'}
        {me.ready ? ' · HAZIR' : ''}
      </p>

      {info?.action ? (
        <p className="mf-panel-text">
          <Moon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          {info.duty} Masada hedefine dokun; seçimin gizli kalır.
          {me.my_action ? ' Seçimin kaydedildi, diğer oyuncular bekleniyor.' : ''}
        </p>
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