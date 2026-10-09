import { tileColor, tileLabel } from './okeyConfig';

// Taşın altındaki şekil: kırmızı üçgen, siyah daire, mavi kare, sarı baklava, joker yıldız.
const SHAPES = {
  R: <polygon points="5 1.2 9.1 8.5 0.9 8.5" />,
  S: <circle cx="5" cy="5" r="3.8" />,
  M: <rect x="1.3" y="1.3" width="7.4" height="7.4" rx="0.6" />,
  Y: <polygon points="5 0.9 9.1 5 5 9.1 0.9 5" />,
  J: <polygon points="5 0.7 6.3 3.5 9.3 3.9 7.1 6.1 7.7 9.2 5 7.7 2.3 9.2 2.9 6.1 0.7 3.9 3.7 3.5" />,
};

/** Tek okey taşı: beyaz zemin, üstte sayı, altta rengin şekli. */
export default function OkeyTile({ tile, size = '', down = false, wild = false, className = '', ...rest }) {
  const classes = ['okey-tile', size && `okey-tile-${size}`, className].filter(Boolean).join(' ');
  if (down) return <span className={`${classes} okey-tile-down`} {...rest} />;
  const color = tileColor(tile);
  return (
    <span className={`${classes} okey-tile-c-${color}${wild ? ' okey-tile-wild' : ''}`} {...rest}>
      <span className="okey-tile-num">{tileLabel(tile)}</span>
      <svg className="okey-tile-shape" viewBox="0 0 10 10" aria-hidden="true">
        {SHAPES[color] || SHAPES.S}
      </svg>
    </span>
  );
}