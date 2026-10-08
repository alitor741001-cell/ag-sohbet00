import React from 'react';
import { Image } from '@/components/ui/image';
import { SEKER_SHAPES } from '@/components/games/seker/sekerShapes';
import { SEKER_SYMBOLS } from '@/components/games/seker/sekerConfig';
import '@/styles/gameHelp.css';

/** Şeker gövdesi: taş listesinde oyunun kendi şekliyle küçük kare olarak çizilir. */
function SekerShape({ id }) {
  const symbol = SEKER_SYMBOLS[id];
  const Shape = symbol ? SEKER_SHAPES[symbol.shape] : null;
  if (!Shape) return null;
  const gradientId = `gh-seker-${id}`;

  return (
    <svg viewBox="0 0 40 40" className="gh-sym-art" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="36%" cy="28%" r="76%">
          <stop offset="0%" stopColor={symbol.light} />
          <stop offset="52%" stopColor={symbol.color} />
          <stop offset="100%" stopColor={symbol.dark} />
        </radialGradient>
      </defs>
      <Shape fill={`url(#${gradientId})`} light={symbol.light} dark={symbol.dark} />
    </svg>
  );
}

/** Taş listesi: her taşın görseli, adı, bahis katı ve ne işe yaradığı tek satırda görünür. */
export default function HelpSymbolGrid({ legend }) {
  if (!legend?.rows?.length) return null;
  const headings = legend.headings || [];

  return (
    <>
      <ul className="gh-symbols">
        {legend.rows.map((row, index) => (
          <li key={`${row.name}-${index}`} className="gh-symbol">
            <span className="gh-sym-tile" data-tone={row.tone}>
              {row.art ? (
                <Image
                  src={row.art}
                  alt={row.name}
                  className="gh-sym-art"
                  fittingType="fit"
                  blurPlaceholder={false}
                  quality={80}
                />
              ) : row.seker ? (
                <SekerShape id={row.seker} />
              ) : (
                <span className="gh-sym-badge">{row.badge}</span>
              )}
            </span>

            <span className="gh-sym-body">
              <span className="gh-sym-head">
                <p className="gh-sym-name">{row.name}</p>
                {row.tag && <em className="gh-sym-tag">{row.tag}</em>}
              </span>
              {row.desc && <p className="gh-sym-desc">{row.desc}</p>}
              {row.pays?.length > 0 && (
                <span className="gh-pays">
                  {row.pays.map((pay, payIndex) => (
                    <span key={payIndex} className="gh-pay">
                      {headings[payIndex] && <em>{headings[payIndex]}</em>}
                      {pay}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {legend.note && <p className="gh-legend-note">{legend.note}</p>}
    </>
  );
}