import React from 'react';
import { Image } from '@/components/ui/image';
import { FUTBOL_CREST_SIZE } from './futbolAssets';
import { TEAM_MAP } from './futbolConfig';

/** Son turların kazananları: yuvarlak arma şeridi, en yeni tur "YENİ" rozetli. */
export default function FutbolResults({ history }) {
  return (
    <div className="fut-results no-scrollbar" aria-label="Son tur kazananları">
      {history.length === 0 && <span className="fut-result fut-result-empty">Henüz sonuç yok</span>}
      {history.map((row, index) => {
        const team = TEAM_MAP[row.winner_id];
        return (
          <span
            key={row.round_no}
            title={team?.name || ''}
            className={`fut-result ${index === 0 ? 'fut-result-new' : ''}`}
          >
            {team && (
              <Image
                src={team.crest}
                alt={team.name}
                className="fut-result-crest"
                fittingType="contain"
                originWidth={FUTBOL_CREST_SIZE}
                originHeight={FUTBOL_CREST_SIZE}
                quality={70}
              />
            )}
            {index === 0 && <b className="fut-result-badge">YENİ</b>}
          </span>
        );
      })}
    </div>
  );
}