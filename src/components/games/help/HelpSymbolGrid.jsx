import React from 'react';
import { Image } from '@/components/ui/image';
import '@/styles/gameHelp.css';

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