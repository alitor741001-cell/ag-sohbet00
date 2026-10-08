import React from 'react';
import { SEKERLI_SHAPES } from './sekerliShapes';
import { SYMBOLS } from './sekerliConfig';

/** Tek sembol: parlak gövdeli 3D şeker, sol üstte cam parlaması ve yumuşak gölge. */
export default function SekerliSymbol({ id, win, boom, fall, index = 0, className = '' }) {
  const symbol = SYMBOLS[id];
  const Shape = symbol ? SEKERLI_SHAPES[symbol.shape] : null;
  if (!symbol || !Shape) return null;

  const gradientId = `sl-body-${id}`;
  const glossId = `sl-gloss-${id}`;
  const classes = [
    'sl-sym',
    symbol.wild ? 'sl-sym-wild' : '',
    symbol.scatter ? 'sl-sym-scatter' : '',
    win ? 'sl-sym-win' : '',
    boom ? 'sl-sym-boom' : '',
    fall ? 'sl-sym-fall' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} style={{ '--sl-row': index }}>
      <svg viewBox="0 0 40 40" className="sl-art" aria-hidden="true">
        <defs>
          <radialGradient id={gradientId} cx="34%" cy="25%" r="80%">
            <stop offset="0%" stopColor={symbol.light} />
            <stop offset="54%" stopColor={symbol.color} />
            <stop offset="100%" stopColor={symbol.dark} />
          </radialGradient>
          <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Shape fill={`url(#${gradientId})`} light={symbol.light} dark={symbol.dark} />
        <ellipse
          cx="13.6"
          cy="11.6"
          rx="6.6"
          ry="4.1"
          fill={`url(#${glossId})`}
          transform="rotate(-26 13.6 11.6)"
        />
      </svg>
      {win && <span className="sl-halo" aria-hidden="true" />}
      <span className="sr-only">{symbol.name}</span>
    </span>
  );
}